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
                console.log(`[Bot] Spawning bot for room: ${roomName}`);
                const botInstance = await spawnBot(sessionId, roomName);
                activeBots.set(sessionId, botInstance);

                // SIMULAÇÃO: Enviar o primeiro insight após 5 segundos
                setTimeout(async () => {
                    console.log('[AI] Sending first insight...');
                    await supabase.channel(`room:${sessionId}`).send({
                        type: 'broadcast',
                        event: 'app-signal',
                        payload: {
                            type: 'AI_INSIGHT',
                            insight: {
                                id: `in-${Date.now()}`,
                                text: 'Detectado uso de "You is" em vez de "You are".',
                                type: 'error'
                            }
                        }
                    });
                }, 5000);
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
