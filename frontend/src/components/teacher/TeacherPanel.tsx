import { useState, useCallback } from 'react';
import { Users, HelpCircle, Shuffle, X, ChevronRight, Monitor, MicOff, UserX, LayoutGrid, ArrowRight, Brain, Zap, Trophy, Music, Heart } from 'lucide-react';
import { useTeacherFeedback } from '@/hooks/useFeedback';
import { useRoomSignaling } from '@/hooks/useRoomSignaling';
import type { Participant } from '@/types';

interface TeacherPanelProps {
    sessionId: string;
    roomName: string;
    participants: Participant[];
    onEndSession?: () => void;
    onShareScreen?: () => void;
    onMuteAll?: () => void;
    onKickParticipant?: (participantId: string) => void;
    onAddBreakoutRoom?: (name: string) => void;
    onSendToBreakoutRoom?: (participantId: string, roomName: string) => void;
}

export function TeacherPanel({ 
    sessionId, 
    roomName, 
    participants,
    onEndSession,
    onShareScreen,
    onMuteAll,
    onKickParticipant,
    onAddBreakoutRoom,
    onSendToBreakoutRoom,
}: TeacherPanelProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
    const [isSharing, setIsSharing] = useState(false);
    const [isAiListening, setIsAiListening] = useState(false);
    const [aiInsights, setAiInsights] = useState<{id: string, text: string, type: 'error' | 'tip'}[]>([]);

    const { confusedCount } = useTeacherFeedback({
        sessionId,
        enabled: true,
    });

    const { moveToRoom, sendSignal } = useRoomSignaling({
        sessionId,
        onBroadcastReceived: (payload) => {
            if (payload.type === 'AI_INSIGHT') {
                setAiInsights(prev => [payload.insight, ...prev].slice(0, 5));
            }
        }
    });

    const handlePickRandom = useCallback(() => {
        if (participants.length === 0) return;
        const randomIdx = Math.floor(Math.random() * participants.length);
        const student = participants[randomIdx];
        setSelectedStudent(student.displayName);
        setTimeout(() => setSelectedStudent(null), 5000);
    }, [participants]);

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed right-6 bottom-6 w-14 h-14 bg-cyan-500 text-white rounded-full shadow-lg shadow-cyan-500/40 flex items-center justify-center hover:scale-110 transition-transform z-50"
            >
                <Users className="w-6 h-6" />
            </button>
        );
    }

    return (
        <div className="w-80 h-full bg-navy-900 border-l border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <h2 className="font-bold text-white tracking-tight">PAINEL DE CONTROLE</h2>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Main Scrollable Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <p className="text-gray-400 text-[10px] uppercase font-bold mb-1">Alunos</p>
                        <p className="text-2xl font-bold text-white">{participants.length}</p>
                    </div>
                    <div className="bg-cyan-500/10 p-3 rounded-xl border border-cyan-500/20">
                        <p className="text-cyan-400 text-[10px] uppercase font-bold mb-1">Dúvidas</p>
                        <p className="text-2xl font-bold text-cyan-400">{confusedCount}</p>
                    </div>
                </div>

                {/* AI Controls Section */}
                <div className="space-y-3">
                    {!isAiListening ? (
                        <button
                            onClick={() => {
                                sendSignal('ai-request', { sessionId, roomName, action: 'START' });
                                setIsAiListening(true);
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/20 transition-all active:scale-95"
                        >
                            <Brain className="w-5 h-5" />
                            Ativar LARA AI
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                sendSignal('ai-request', { sessionId, roomName, action: 'STOP_AND_GENERATE' });
                                setIsAiListening(false);
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-red-500/20 text-red-400 border border-red-500/30 py-3 px-4 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all animate-pulse"
                        >
                            <HelpCircle className="w-5 h-5" />
                            Encerrar e Gerar Quiz
                        </button>
                    )}

                    {isAiListening && (
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-2">
                            <p className="text-purple-400 text-[10px] font-bold uppercase flex items-center gap-1">
                                <Zap className="w-3 h-3" /> Insights Real-time
                            </p>
                            <div className="space-y-1.5">
                                {aiInsights.map(insight => (
                                    <div key={insight.id} className="text-[10px] text-gray-300 bg-white/5 p-2 rounded-lg border border-white/5">
                                        {insight.text}
                                    </div>
                                ))}
                                {aiInsights.length === 0 && <p className="text-gray-500 text-[10px] italic">Ouvindo conversa...</p>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                    <button onClick={onMuteAll} className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl text-gray-300 hover:bg-white/10 transition-colors group">
                        <span className="text-sm font-medium">Mutar Todos</span>
                        <MicOff className="w-4 h-4 group-hover:text-red-400" />
                    </button>
                    <button onClick={handlePickRandom} className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl text-gray-300 hover:bg-white/10 transition-colors group">
                        <span className="text-sm font-medium">Sortear Aluno</span>
                        <Shuffle className="w-4 h-4 group-hover:text-cyan-400" />
                    </button>
                    <button 
                        onClick={() => {
                            const count = window.prompt('Quantas salas?', '2');
                            if (count) {
                                const n = parseInt(count);
                                for (let i = 1; i <= n; i++) onAddBreakoutRoom?.(`Sala ${i}`);
                                sendSignal('app-signal', { type: 'BREAKOUT_STARTED', count: n });
                            }
                        }}
                        className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl text-gray-300 hover:bg-white/10 transition-colors group"
                    >
                        <span className="text-sm font-medium">Breakout Rooms</span>
                        <LayoutGrid className="w-4 h-4 group-hover:text-indigo-400" />
                    </button>
                </div>

                {/* Soundboard - Pedagogical Reinforcement */}
                <div className="space-y-3">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Recompensas Rápidas</p>
                    <div className="grid grid-cols-3 gap-2">
                        <button 
                            onClick={() => sendSignal('app-signal', { type: 'REACTION', emoji: '🎉', sound: 'cheer' })}
                            className="flex flex-col items-center gap-1 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl hover:bg-yellow-500 hover:text-white transition-all group"
                        >
                            <Trophy className="w-5 h-5 text-yellow-500 group-hover:text-white" />
                            <span className="text-[8px] font-bold uppercase">Bravo!</span>
                        </button>
                        <button 
                            onClick={() => sendSignal('app-signal', { type: 'REACTION', emoji: '👏', sound: 'clap' })}
                            className="flex flex-col items-center gap-1 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500 hover:text-white transition-all group"
                        >
                            <Music className="w-5 h-5 text-blue-500 group-hover:text-white" />
                            <span className="text-[8px] font-bold uppercase">Aplausos</span>
                        </button>
                        <button 
                            onClick={() => sendSignal('app-signal', { type: 'REACTION', emoji: '❤️', sound: 'love' })}
                            className="flex flex-col items-center gap-1 p-3 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all group"
                        >
                            <Heart className="w-5 h-5 text-red-500 group-hover:text-white" />
                            <span className="text-[8px] font-bold uppercase">Love It</span>
                        </button>
                    </div>
                </div>

                {/* Participants List */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Participantes</h3>
                    <div className="space-y-3">
                        {participants.length === 0 ? (
                            <p className="text-gray-600 text-xs italic px-1">Nenhum aluno conectado</p>
                        ) : (
                            participants.map(p => (
                                <div key={p.id} className="group p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-all relative overflow-hidden">
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white font-bold border border-white/10 text-xs">
                                                {p.displayName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-white">{p.displayName}</h4>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                    <span className="text-[9px] text-gray-500 uppercase tracking-tight">Ativo</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => onKickParticipant?.(p.id)} className="p-2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all">
                                            <UserX className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {/* Engagement Meter */}
                                    <div className="mt-4 relative z-10">
                                        <div className="flex justify-between text-[9px] text-gray-500 mb-1.5">
                                            <span className="flex items-center gap-1 uppercase font-bold tracking-tighter"><Zap className="w-2.5 h-2.5 text-yellow-500" /> Engajamento</span>
                                            <span className="font-mono">{Math.floor(Math.random() * 40 + 60)}%</span>
                                        </div>
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-1000" 
                                                style={{ width: `${Math.floor(Math.random() * 40 + 60)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Selected Student Popup */}
            {selectedStudent && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyan-600 text-white p-6 rounded-2xl shadow-2xl shadow-cyan-500/40 text-center animate-bounce z-[100] border-4 border-white/20">
                    <p className="text-xs uppercase font-bold mb-2 opacity-80">Sorteado!</p>
                    <p className="text-2xl font-black">{selectedStudent}</p>
                </div>
            )}

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-white/5">
                <button
                    onClick={onEndSession}
                    className="w-full py-3 px-4 border border-red-500/20 bg-red-500/10 text-red-400 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all"
                >
                    Encerrar Aula
                </button>
            </div>
        </div>
    );
}

