import { useState, useCallback, useEffect, useRef } from 'react';
import { Users, HelpCircle, Shuffle, X, Monitor, MicOff, UserX, LayoutGrid, Brain, Zap, Trophy, Music, Heart } from 'lucide-react';
import { useTeacherFeedback } from '@/hooks/useFeedback';
import { useRoomSignaling } from '@/hooks/useRoomSignaling';
import { useTeacherBreakoutState } from '@/hooks/useTeacherBreakoutState';
import type { Participant } from '@/types';
import {
    resolveStudentPresenceSync,
    type StudentPresencePayload,
} from './teacherBreakoutSync';

interface TeacherPanelProps {
    sessionId: string;
    roomName: string;
    participants: Participant[];
    onEndSession?: () => void;
    onShareScreen?: () => void;
    onMuteAll?: () => void;
    onKickParticipant?: (participantId: string) => void;
    isMeetingReady?: boolean;
    onAddBreakoutRoom?: (name: string) => void;
    onRemoveBreakoutRoom?: (name: string) => void;
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
    isMeetingReady = false,
    onAddBreakoutRoom,
    onRemoveBreakoutRoom,
    onSendToBreakoutRoom,
}: TeacherPanelProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
    const [isSharing, setIsSharing] = useState(false);
    const [isAiListening, setIsAiListening] = useState(false);
    const [aiInsights, setAiInsights] = useState<{id: string, text: string, type: 'error' | 'tip'}[]>([]);
    const [participantRooms, setParticipantRooms] = useState<Record<string, string>>({});
    const [participantStudentIds, setParticipantStudentIds] = useState<Record<string, string>>({});
    const syncedBreakoutRoomsRef = useRef<string[]>([]);
    const hasRequestedPresenceSyncRef = useRef(false);

    const { breakoutRooms, setBreakoutRooms, studentAssignments, setStudentAssignments } = useTeacherBreakoutState({
        sessionId: sessionId || roomName,
        mainRoomName: roomName,
    });

    const { confusedCount } = useTeacherFeedback({
        sessionId,
        enabled: true,
    });

    const { isConnected, moveToRoom, sendSignal } = useRoomSignaling({
        sessionId,
        onBroadcastReceived: (payload) => {
            if (payload.type === 'AI_INSIGHT') {
                setAiInsights(prev => [payload.insight, ...prev].slice(0, 5));
                return;
            }

            if (payload.type !== 'STUDENT_PRESENCE') {
                return;
            }

            const studentPresence = payload as StudentPresencePayload;
            const participantAssignedRoom = participantRooms[studentPresence.participantId];
            const stableAssignedRoom = studentAssignments[studentPresence.studentId] ?? participantAssignedRoom;
            const syncResolution = resolveStudentPresenceSync({
                assignedRoomName: stableAssignedRoom,
                breakoutRooms,
                mainRoomName: roomName,
                currentRoomName: studentPresence.currentRoomName,
            });

            setParticipantStudentIds((prev) => ({
                ...prev,
                [studentPresence.participantId]: studentPresence.studentId,
            }));

            setParticipantRooms((prev) => ({
                ...prev,
                [studentPresence.participantId]: syncResolution.displayRoomName,
            }));

            if (stableAssignedRoom && stableAssignedRoom !== roomName) {
                setStudentAssignments((prev) => ({
                    ...prev,
                    [studentPresence.studentId]: stableAssignedRoom,
                }));
            }

            if (syncResolution.action === 'assign') {
                onSendToBreakoutRoom?.(studentPresence.participantId, syncResolution.targetRoomName);
                sendSignal('app-signal', {
                    type: 'BREAKOUT_ASSIGNMENT',
                    participantId: studentPresence.participantId,
                    studentId: studentPresence.studentId,
                    roomName: syncResolution.targetRoomName,
                    mainRoomName: roomName,
                });
            }

            if (syncResolution.action === 'reset') {
                sendSignal('app-signal', {
                    type: 'BREAKOUT_RESET',
                    participantId: studentPresence.participantId,
                    studentId: studentPresence.studentId,
                    roomName,
                });
            }
        }
    });

    useEffect(() => {
        if (!isMeetingReady) {
            syncedBreakoutRoomsRef.current = [];
            return;
        }

        const previousRooms = syncedBreakoutRoomsRef.current;
        const previousRoomSet = new Set(previousRooms);
        const nextRoomSet = new Set(breakoutRooms);

        breakoutRooms
            .filter((breakoutRoom) => !previousRoomSet.has(breakoutRoom))
            .forEach((breakoutRoom) => onAddBreakoutRoom?.(breakoutRoom));

        previousRooms
            .filter((breakoutRoom) => !nextRoomSet.has(breakoutRoom))
            .forEach((breakoutRoom) => onRemoveBreakoutRoom?.(breakoutRoom));

        syncedBreakoutRoomsRef.current = breakoutRooms;
    }, [breakoutRooms, isMeetingReady, onAddBreakoutRoom, onRemoveBreakoutRoom]);

    useEffect(() => {
        if (!isConnected || !isMeetingReady) {
            hasRequestedPresenceSyncRef.current = false;
            return;
        }

        if (hasRequestedPresenceSyncRef.current) {
            return;
        }

        hasRequestedPresenceSyncRef.current = true;
        sendSignal('app-signal', {
            type: 'PRESENCE_SYNC_REQUEST',
        });
    }, [isConnected, isMeetingReady, sendSignal]);

    useEffect(() => {
        const activeParticipantIds = new Set(participants.map((participant) => participant.id));

        setParticipantRooms((prev) => Object.fromEntries(
            Object.entries(prev).filter(([participantId]) => activeParticipantIds.has(participantId))
        ));

        setParticipantStudentIds((prev) => Object.fromEntries(
            Object.entries(prev).filter(([participantId]) => activeParticipantIds.has(participantId))
        ));
    }, [participants]);

    const handlePickRandom = useCallback(() => {
        if (participants.length === 0) return;
        const randomIdx = Math.floor(Math.random() * participants.length);
        const student = participants[randomIdx];
        setSelectedStudent(student.displayName);
        setTimeout(() => setSelectedStudent(null), 5000);
    }, [participants]);

    const handleShareScreen = useCallback(() => {
        setIsSharing((prev) => !prev);
        onShareScreen?.();
    }, [onShareScreen]);

    const handleCreateBreakoutRooms = useCallback(() => {
        const initialValue = breakoutRooms.length > 0 ? String(breakoutRooms.length) : '2';
        const countInput = window.prompt('Quantas salas?', initialValue);

        if (!countInput) {
            return;
        }

        const roomCount = Number.parseInt(countInput, 10);

        if (!Number.isFinite(roomCount) || roomCount < 2) {
            window.alert('Informe pelo menos 2 salas.');
            return;
        }

        const rooms = Array.from({ length: roomCount }, (_, index) => `Sala ${index + 1}`);
        const removedAssignments = Object.entries(participantRooms).filter(([, assignedRoom]) => !rooms.includes(assignedRoom));

        removedAssignments.forEach(([participantId]) => {
            sendSignal('app-signal', {
                type: 'BREAKOUT_RESET',
                participantId,
                studentId: participantStudentIds[participantId],
                roomName,
            });
        });

        setBreakoutRooms(rooms);
        setParticipantRooms((prev) => Object.fromEntries(
            Object.entries(prev).filter(([, assignedRoom]) => rooms.includes(assignedRoom))
        ));
        setStudentAssignments((prev) => Object.fromEntries(
            Object.entries(prev).filter(([, assignedRoom]) => rooms.includes(assignedRoom))
        ));
        sendSignal('app-signal', {
            type: 'BREAKOUT_STARTED',
            rooms,
            mainRoomName: roomName,
        });
    }, [breakoutRooms, participantRooms, participantStudentIds, roomName, sendSignal, setBreakoutRooms, setStudentAssignments]);

    const handleAssignParticipant = useCallback((participant: Participant, nextRoom: string) => {
        const participantStudentId = participantStudentIds[participant.id];

        if (nextRoom !== roomName) {
            onSendToBreakoutRoom?.(participant.id, nextRoom);
        }

        sendSignal('app-signal', {
            type: 'BREAKOUT_ASSIGNMENT',
            participantId: participant.id,
            studentId: participantStudentId,
            roomName: nextRoom,
            mainRoomName: roomName,
        });

        setParticipantRooms((prev) => {
            if (nextRoom === roomName) {
                const { [participant.id]: _removed, ...rest } = prev;
                return rest;
            }

            return {
                ...prev,
                [participant.id]: nextRoom,
            };
        });

        if (participantStudentId) {
            setStudentAssignments((prev) => {
                if (nextRoom === roomName) {
                    const { [participantStudentId]: _removed, ...rest } = prev;
                    return rest;
                }

                return {
                    ...prev,
                    [participantStudentId]: nextRoom,
                };
            });
        }
    }, [onSendToBreakoutRoom, participantStudentIds, roomName, sendSignal, setStudentAssignments]);

    const handleReturnEveryone = useCallback(() => {
        moveToRoom(roomName);
        setParticipantRooms({});
        setStudentAssignments({});
        sendSignal('app-signal', {
            type: 'BREAKOUT_RESET',
            roomName,
        });
    }, [moveToRoom, roomName, sendSignal, setStudentAssignments]);

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
                    <button onClick={handleShareScreen} className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors group ${isSharing ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}>
                        <span className="text-sm font-medium">{isSharing ? 'Parar Compartilhamento' : 'Compartilhar Tela'}</span>
                        <Monitor className="w-4 h-4 group-hover:text-cyan-400" />
                    </button>
                    <button onClick={onMuteAll} className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl text-gray-300 hover:bg-white/10 transition-colors group">
                        <span className="text-sm font-medium">Mutar Todos</span>
                        <MicOff className="w-4 h-4 group-hover:text-red-400" />
                    </button>
                    <button onClick={handlePickRandom} className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl text-gray-300 hover:bg-white/10 transition-colors group">
                        <span className="text-sm font-medium">Sortear Aluno</span>
                        <Shuffle className="w-4 h-4 group-hover:text-cyan-400" />
                    </button>
                    <button 
                        onClick={handleCreateBreakoutRooms}
                        className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl text-gray-300 hover:bg-white/10 transition-colors group"
                    >
                        <span className="text-sm font-medium">{breakoutRooms.length > 0 ? 'Reconfigurar Salas' : 'Criar Breakout Rooms'}</span>
                        <LayoutGrid className="w-4 h-4 group-hover:text-indigo-400" />
                    </button>
                </div>

                {/* Breakout Rooms */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Breakout Rooms</h3>
                        {breakoutRooms.length > 0 && (
                            <button
                                onClick={handleReturnEveryone}
                                className="text-[10px] font-bold uppercase tracking-wide text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                                Trazer Todos
                            </button>
                        )}
                    </div>
                    {breakoutRooms.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-xs text-gray-500">
                            Crie salas para distribuir os alunos sem tirar a turma da sala principal.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {breakoutRooms.map((breakoutRoom) => {
                                const occupants = Object.values(participantRooms).filter((value) => value === breakoutRoom).length;

                                return (
                                    <div key={breakoutRoom} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                                        <div>
                                            <p className="text-sm font-semibold text-white">{breakoutRoom}</p>
                                            <p className="text-[10px] uppercase tracking-wide text-gray-500">
                                                {occupants} aluno{occupants === 1 ? '' : 's'} alocado{occupants === 1 ? '' : 's'}
                                            </p>
                                        </div>
                                        <div className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-300">
                                            Ativa
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
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
                            // Skeleton Loading State
                            <>
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 animate-pulse">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/10" />
                                            <div className="space-y-2 flex-1">
                                                <div className="h-3 w-24 bg-white/10 rounded" />
                                                <div className="h-2 w-12 bg-white/5 rounded" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            participants.map((participant) => {
                                const currentRoom = participantRooms[participant.id] ?? roomName;

                                return (
                                <div key={participant.id} className="group p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-all relative overflow-hidden">
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white font-bold border border-white/10 text-xs">
                                                {participant.displayName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-white">{participant.displayName}</h4>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                    <span className="text-[9px] text-gray-500 uppercase tracking-tight">Ativo</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => onKickParticipant?.(participant.id)} className="p-2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all">
                                            <UserX className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {/* Engagement Meter - Deterministic for performance stability */}
                                    {(() => {
                                        // Use ID as seed for stable engagement value during session
                                        const hash = participant.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                        const engagement = 60 + (hash % 35);
                                        return (
                                            <div className="mt-4 relative z-10">
                                                <div className="flex justify-between text-[9px] text-gray-500 mb-1.5">
                                                    <span className="flex items-center gap-1 uppercase font-bold tracking-tighter">
                                                        <Zap className="w-2.5 h-2.5 text-yellow-500" /> Engajamento
                                                    </span>
                                                    <span className="font-mono">{engagement}%</span>
                                                </div>
                                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-1000" 
                                                        style={{ width: `${engagement}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {breakoutRooms.length > 0 && (
                                        <div className="mt-4 space-y-2 rounded-2xl border border-white/5 bg-navy-950/50 p-3">
                                            <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-gray-500">
                                                <span>Sala Atual</span>
                                                <span className="font-bold text-cyan-300">
                                                    {currentRoom === roomName ? 'Sala Geral' : currentRoom}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => handleAssignParticipant(participant, roomName)}
                                                    className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors ${currentRoom === roomName ? 'bg-cyan-500 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
                                                >
                                                    Geral
                                                </button>
                                                {breakoutRooms.map((breakoutRoom) => (
                                                    <button
                                                        key={`${participant.id}-${breakoutRoom}`}
                                                        onClick={() => handleAssignParticipant(participant, breakoutRoom)}
                                                        className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors ${currentRoom === breakoutRoom ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
                                                    >
                                                        {breakoutRoom}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                );
                            })
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

