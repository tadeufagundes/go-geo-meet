import React from 'react';
import { Users, Zap, Brain, CheckCircle, ArrowRight, Download, Share2 } from 'lucide-react';

interface ParticipantStats {
    id: string;
    displayName: string;
    engagement: number;
    present: boolean;
}

interface EndSessionSummaryProps {
    roomName: string;
    participants: ParticipantStats[];
    topInsights: string[];
    quizResults: { total: number; correct: number };
    onClose: () => void;
}

export function EndSessionSummary({ roomName, participants, topInsights, quizResults, onClose }: EndSessionSummaryProps) {
    const avgEngagement = participants.length > 0 
        ? Math.round(participants.reduce((acc, p) => acc + p.engagement, 0) / participants.length)
        : 0;

    return (
        <div className="fixed inset-0 z-[200] bg-navy-950 flex items-center justify-center p-6 overflow-y-auto">
            <div className="w-full max-w-4xl bg-navy-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in duration-500">
                
                {/* Sidebar - Quick Stats */}
                <div className="w-full md:w-72 bg-white/5 p-8 border-r border-white/10 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Aula Encerrada!</h2>
                    <p className="text-gray-400 text-sm mb-8">Resumo da sessão em {roomName}</p>
                    
                    <div className="w-full space-y-4">
                        <div className="p-4 bg-navy-950 rounded-2xl border border-white/5">
                            <p className="text-[10px] font-bold text-gray-500 uppercase">Engajamento Médio</p>
                            <p className="text-2xl font-black text-cyan-400">{avgEngagement}%</p>
                        </div>
                        <div className="p-4 bg-navy-950 rounded-2xl border border-white/5">
                            <p className="text-[10px] font-bold text-gray-500 uppercase">Presença</p>
                            <p className="text-2xl font-black text-white">{participants.filter(p => p.present).length} / {participants.length}</p>
                        </div>
                    </div>

                    <div className="mt-auto pt-8 w-full space-y-3">
                        <button className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 text-white rounded-xl text-xs font-bold hover:bg-white/10 transition-colors">
                            <Download className="w-4 h-4" /> Exportar PDF
                        </button>
                        <button 
                            onClick={onClose}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-500 text-white rounded-xl text-xs font-bold hover:bg-cyan-600 transition-colors"
                        >
                            <ArrowRight className="w-4 h-4" /> Voltar ao Início
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        {/* AI Insights Summary */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-purple-400">
                                <Brain className="w-5 h-5" />
                                <h3 className="font-bold uppercase tracking-widest text-xs">Top Insights da LARA</h3>
                            </div>
                            <div className="space-y-3">
                                {topInsights.map((insight, i) => (
                                    <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 text-sm text-gray-300 leading-relaxed italic">
                                        "{insight}"
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quiz Results & Presence List */}
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-yellow-500">
                                    <Zap className="w-5 h-5" />
                                    <h3 className="font-bold uppercase tracking-widest text-xs">Resultado do Quiz</h3>
                                </div>
                                <div className="p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-3xl border border-yellow-500/20">
                                    <div className="flex items-end gap-2 mb-2">
                                        <p className="text-4xl font-black text-white">{quizResults.correct}</p>
                                        <p className="text-gray-500 mb-1">de {quizResults.total} acertaram</p>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-yellow-500" 
                                            style={{ width: `${(quizResults.correct / quizResults.total) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-cyan-400">
                                    <Users className="w-5 h-5" />
                                    <h3 className="font-bold uppercase tracking-widest text-xs">Lista de Participação</h3>
                                </div>
                                <div className="space-y-2">
                                    {participants.map(p => (
                                        <div key={p.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl text-sm">
                                            <span className="text-gray-300">{p.displayName}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.engagement > 70 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                {p.engagement}% Engajamento
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
