import { useState, useCallback } from 'react';
import { Users, HelpCircle, Shuffle, X, ChevronRight, Monitor, MicOff, UserX } from 'lucide-react';
import { useTeacherFeedback } from '@/hooks/useFeedback';
import type { Participant } from '@/types';

interface TeacherPanelProps {
    sessionId: string;
    participants: Participant[];
    onEndSession?: () => void;
    onShareScreen?: () => void;
    onMuteAll?: () => void;
    onKickParticipant?: (participantId: string) => void;
}

export function TeacherPanel({ 
    sessionId, 
    participants, 
    onEndSession,
    onShareScreen,
    onMuteAll,
    onKickParticipant,
}: TeacherPanelProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
    const [isSharing, setIsSharing] = useState(false);

    const { confusedStudents, confusedCount } = useTeacherFeedback({
        sessionId,
        enabled: true,
    });

    const handlePickRandom = useCallback(() => {
        // Pick from all participants, not just confused ones
        if (participants.length === 0) return;
        const randomIndex = Math.floor(Math.random() * participants.length);
        const picked = participants[randomIndex];
        setSelectedStudent(picked.displayName);

        // Clear selection after 5 seconds
        setTimeout(() => setSelectedStudent(null), 5000);
    }, [participants]);

    const handleShareScreen = useCallback(() => {
        setIsSharing(!isSharing);
        onShareScreen?.();
    }, [isSharing, onShareScreen]);

    const handleMuteAll = useCallback(() => {
        if (window.confirm('Silenciar todos os participantes?')) {
            onMuteAll?.();
        }
    }, [onMuteAll]);

    const handleKickParticipant = useCallback((participantId: string, displayName: string) => {
        if (window.confirm(`Remover "${displayName}" da aula?`)) {
            onKickParticipant?.(participantId);
        }
    }, [onKickParticipant]);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed right-0 top-1/2 -translate-y-1/2 bg-navy-900 text-white p-2 rounded-l-lg shadow-lg hover:bg-navy-800 transition-colors"
                aria-label="Abrir painel do professor"
            >
                <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
        );
    }

    return (
        <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl flex flex-col z-50">
            {/* Header */}
            <div className="bg-navy-900 text-white p-4 flex items-center justify-between">
                <h2 className="font-semibold">Painel do Professor</h2>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-navy-800 rounded transition-colors"
                    aria-label="Fechar painel"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 p-4 border-b">
                <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Users className="w-4 h-4" />
                        <span>Participantes</span>
                    </div>
                    <p className="text-2xl font-bold text-navy-900 mt-1">
                        {participants.length + 1}
                    </p>
                </div>
                <div className={`rounded-lg p-3 ${confusedCount > 0 ? 'bg-cyan-50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <HelpCircle className={`w-4 h-4 ${confusedCount > 0 ? 'text-cyan-500' : ''}`} />
                        <span>Com dúvida</span>
                    </div>
                    <p className={`text-2xl font-bold mt-1 ${confusedCount > 0 ? 'text-cyan-600' : 'text-navy-900'}`}>
                        {confusedCount}
                    </p>
                </div>
            </div>

            {/* Random student picker result */}
            {selectedStudent && (
                <div className="mx-4 mt-4 p-4 bg-gold/20 border border-gold rounded-lg text-center animate-pulse">
                    <p className="text-sm text-gray-600">Aluno sorteado:</p>
                    <p className="text-xl font-bold text-navy-900">{selectedStudent}</p>
                </div>
            )}

            {/* Moderator Controls */}
            <div className="p-4 border-b space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Controles do Professor
                </p>
                
                {/* Share Screen Button */}
                <button
                    onClick={handleShareScreen}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-colors ${
                        isSharing 
                            ? 'bg-green-500 text-white hover:bg-green-600' 
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                >
                    <Monitor className="w-5 h-5" />
                    {isSharing ? 'Parar Compartilhamento' : 'Compartilhar Tela'}
                </button>

                {/* Mute All Button */}
                <button
                    onClick={handleMuteAll}
                    disabled={participants.length === 0}
                    className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <MicOff className="w-5 h-5" />
                    Silenciar Todos
                </button>

                {/* Random Pick Button */}
                <button
                    onClick={handlePickRandom}
                    disabled={participants.length === 0}
                    className="w-full flex items-center justify-center gap-2 bg-cyan-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Shuffle className="w-5 h-5" />
                    Sortear Aluno
                </button>
            </div>

            {/* Participants list */}
            <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Participantes</h3>
                <ul className="space-y-2">
                    {participants.length === 0 ? (
                        <li className="text-gray-400 text-sm text-center py-4">
                            Nenhum aluno entrou ainda
                        </li>
                    ) : (
                        participants.map((participant) => {
                            const isConfused = confusedStudents.some(
                                (s) => s.alunoName === participant.displayName
                            );
                            return (
                                <li
                                    key={participant.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg ${
                                        isConfused ? 'bg-cyan-50 border border-cyan-200' : 'bg-gray-50'
                                    }`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-navy-900 text-white flex items-center justify-center text-sm font-medium">
                                        {participant.displayName.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="flex-1 text-sm font-medium text-gray-800">
                                        {participant.displayName}
                                    </span>
                                    {isConfused && (
                                        <HelpCircle className="w-5 h-5 text-cyan-500" aria-label="Com dúvida" />
                                    )}
                                    {/* Kick button */}
                                    <button
                                        onClick={() => handleKickParticipant(participant.id, participant.displayName)}
                                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                        aria-label={`Remover ${participant.displayName}`}
                                        title="Remover da aula"
                                    >
                                        <UserX className="w-4 h-4" />
                                    </button>
                                </li>
                            );
                        })
                    )}
                </ul>
            </div>

            {/* Footer with end session */}
            <div className="p-4 border-t">
                <button
                    onClick={onEndSession}
                    className="w-full py-3 px-4 border-2 border-red-500 text-red-500 rounded-lg font-medium hover:bg-red-50 transition-colors"
                >
                    Encerrar Aula
                </button>
            </div>
        </div>
    );
}

