require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');
const { spawnBot } = require('./bot');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Configuração Agnóstica de IA
const aiClient = new OpenAI({
    apiKey: process.env.AI_API_KEY || 'sk-placeholder',
    baseURL: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
});

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('--- Go Geo Meet AI Backend Started ---');

/**
 * Global map to track active bots
 */
const activeBots = new Map();

/**
 * Listener for AI Feedback signals
 */
const subscribeToSignals = () => {
    const channel = supabase.channel('ai-signals')
        .on('broadcast', { event: 'ai-request' }, async ({ payload }) => {
            console.log('[Signal] AI Request received:', payload);
            
            const { sessionId, roomName, action } = payload;
            
            if (action === 'START') {
                console.log(`[Bot] Requesting bot for room: ${roomName}`);
                try {
                    // Evitar múltiplos bots para a mesma sessão
                    if (activeBots.has(sessionId)) {
                        console.warn(`[Bot] Session ${sessionId} already has an active bot.`);
                        return;
                    }

                    const botInstance = await spawnBot(sessionId, roomName);
                    
                    // Monitorar se o bot fechar inesperadamente
                    botInstance.on('close', () => {
                        console.log(`[Bot] Bot for ${sessionId} closed.`);
                        activeBots.delete(sessionId);
                    });

                    activeBots.set(sessionId, botInstance);
                    console.log(`[Bot] Bot successfully spawned for ${sessionId}`);

                    // Insight inicial de boas-vindas
                    setTimeout(async () => {
                        await supabase.channel(`room:${sessionId}`).send({
                            type: 'broadcast',
                            event: 'app-signal',
                            payload: {
                                type: 'AI_INSIGHT',
                                insight: { id: `in-${Date.now()}`, text: 'LARA AI está conectada e ouvindo a sala.', type: 'tip' }
                            }
                        });
                    }, 3000);
                } catch (err) {
                    console.error(`[Bot] Failed to spawn bot for ${sessionId}:`, err);
                    // Notificar frontend da falha se necessário
                }
            } else if (action === 'STOP_AND_GENERATE') {
                console.log(`[AI] Analyzing session transcript for: ${sessionId}`);
                
                // 1. Close the bot and get transcript (Simulated transcript for now)
                const bot = activeBots.get(sessionId);
                let transcript = "You is my friend. I is hungry. She are happy."; // This would come from the bot capture
                
                if (bot) {
                    // transcript = await bot.getTranscript(); // Future implementation
                    await bot.close();
                    activeBots.delete(sessionId);
                }

                try {
                    // 2. Real AI Analysis (Agnostic)
                    const response = await aiClient.chat.completions.create({
                        model: process.env.AI_MODEL || "gpt-3.5-turbo",
                        messages: [
                            { 
                                role: "system", 
                                content: "You are a pedagogical English teaching assistant. Analyze transcripts for common grammatical errors. Create a multiple-choice quiz question (A/B) to correct one common error without naming the student. Provide a clear explanation and a follow-up prompt for students to create their own sentence." 
                            },
                            { 
                                role: "user", 
                                content: `Transcript: ${transcript}. Generate a JSON object with: { question, options: [correct, incorrect], correctIndex: 0, explanation, followUpPrompt }` 
                            }
                        ],
                        response_format: { type: "json_object" }
                    });

                    const aiQuiz = JSON.parse(response.choices[0].message.content);

                    // 3. Broadcast to students
                    console.log('[Realtime] Broadcasting AI-generated quiz...');
                    await supabase.channel(`room:${sessionId}`).send({
                        type: 'broadcast',
                        event: 'app-signal',
                        payload: {
                            type: 'QUIZ_RECEIVED',
                            quiz: {
                                id: `quiz-${Date.now()}`,
                                ...aiQuiz
                            }
                        }
                    });
                } catch (err) {
                    console.error('[AI] Generation failed:', err);
                }
            }
        })
        .subscribe();
};

subscribeToSignals();
