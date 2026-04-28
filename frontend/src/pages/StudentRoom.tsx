import { useCallback, useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { JitsiMeet } from '../components/jitsi/JitsiMeet';
import { FeedbackButton } from '../components/student/FeedbackButton';
import { BroadcastView } from '../components/student/BroadcastView';
import { QuizModal, type QuizQuestion } from '../components/student/QuizModal';
import { Video, LogOut, Users } from 'lucide-react';
import * as attendanceService from '../services/attendanceService';
import { useRoomSignaling } from '../hooks/useRoomSignaling';
import { useStudentSessionState } from '../hooks/useStudentSessionState';

export function StudentRoom() {
    const { sessionId: roomName } = useParams<{ sessionId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const studentName = searchParams.get('name') || 'Aluno';
    const apiSessionId = searchParams.get('sessionId') || roomName || '';

    const [isReady, setIsReady] = useState(false);
    const [attendanceId, setAttendanceId] = useState<string | null>(null);
    const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion | null>(null);
    const [activeReaction, setActiveReaction] = useState<string | null>(null);
    const [localParticipantId, setLocalParticipantId] = useState<string | null>(null);
    const hasJoined = useRef(false);
    const {
        studentId,
        currentRoomName,
        setCurrentRoomName,
        resetRoomName,
    } = useStudentSessionState({
        sessionId: apiSessionId,
        studentName,
        mainRoomName: roomName || '',
    });

    const { isConnected, sendSignal } = useRoomSignaling({
        sessionId: apiSessionId,
        onMoveToRoom: (newRoom) => {
            console.log('[Student] Switching to room:', newRoom);
            setCurrentRoomName(newRoom);
        },
        onBroadcastReceived: (payload) => {
            if (payload.type === 'QUIZ_RECEIVED') {
                console.log('[Student] Quiz received:', payload.quiz);
                setCurrentQuiz(payload.quiz);
            } else if (
                payload.type === 'BREAKOUT_ASSIGNMENT'
                && (payload.studentId === studentId || payload.participantId === localParticipantId)
            ) {
                console.log('[Student] Breakout assignment received:', payload.roomName);
                setCurrentRoomName(payload.roomName);
            } else if (
                payload.type === 'BREAKOUT_RESET'
                && payload.roomName
                && (!payload.studentId || payload.studentId === studentId || payload.participantId === localParticipantId)
            ) {
                console.log('[Student] Returning to main room:', payload.roomName);
                setCurrentRoomName(payload.roomName);
            } else if (payload.type === 'REACTION') {
                console.log('[Student] Reaction received:', payload.emoji);
                setActiveReaction(payload.emoji);
                setTimeout(() => setActiveReaction(null), 3000);
            }
        }
    });

    // Record join on mount
    useEffect(() => {
        if (apiSessionId && !hasJoined.current) {
            hasJoined.current = true;
            attendanceService.joinSession(apiSessionId, studentName)
                .then((response) => {
                    setAttendanceId(response.attendanceId);
                    console.log('Attendance recorded:', response.attendanceId);
                })
                .catch((err) => {
                    console.error('Error recording attendance:', err);
                });
        }
    }, [apiSessionId, studentName]);

    useEffect(() => {
        if (!apiSessionId || !localParticipantId || !isConnected) {
            return;
        }

        void sendSignal('app-signal', {
            type: 'STUDENT_PRESENCE',
            participantId: localParticipantId,
            studentId,
            studentName,
            currentRoomName,
        });
    }, [apiSessionId, currentRoomName, isConnected, localParticipantId, sendSignal, studentId, studentName]);

    const handleMeetingEnd = useCallback(async () => {
        resetRoomName();

        // Record leave
        if (apiSessionId && attendanceId) {
            try {
                await attendanceService.leaveSession(apiSessionId, attendanceId);
            } catch (err) {
                console.error('Error recording leave:', err);
            }
        }
        navigate('/login');
    }, [apiSessionId, attendanceId, navigate, resetRoomName]);

    const handleLeave = useCallback(() => {
        if (window.confirm('Tem certeza que deseja sair da aula?')) {
            handleMeetingEnd();
        }
    }, [handleMeetingEnd]);

    if (!roomName) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <Video className="w-16 h-16 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">Sessão não encontrada</p>
                <button
                    onClick={() => navigate('/login')}
                    className="text-cyan-500 hover:text-cyan-600"
                >
                    Voltar ao início
                </button>
            </div>
        );
    }

    return (
        <div className="h-screen bg-navy-950 flex flex-col overflow-hidden font-sans">
            {/* Premium Glassmorphism Header */}
            <header className="bg-navy-900/50 backdrop-blur-xl border-b border-white/10 text-white px-6 py-4 flex items-center justify-between z-50">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20 rotate-3">
                            <Video className="w-6 h-6 text-white" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-navy-900" />
                    </div>
                    <div>
                        <h1 className="font-black text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">GO GEO MEET</h1>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest px-1.5 py-0.5 bg-cyan-400/10 rounded">ALUNO</span>
                            <span className="text-xs text-gray-400 font-medium">| {studentName}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Live Indicator */}
                    {isReady && (
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-full border border-green-500/20">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Ao Vivo</span>
                        </div>
                    )}

                    {/* Feedback button */}
                    {isReady && (
                        <FeedbackButton
                            sessionId={apiSessionId}
                            alunoId={studentId}
                            alunoName={studentName}
                        />
                    )}

                    {/* Leave button */}
                    <button
                        onClick={handleLeave}
                        className="group flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl border border-red-500/20 transition-all duration-300 font-bold text-sm"
                    >
                        <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span>Sair</span>
                    </button>
                </div>
            </header>

            {/* Main Area with dynamic layout */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-navy-950 gap-4 p-4">
                {/* Breakout Room View (Current Room) */}
                <div className={`relative flex-1 transition-all duration-700 ease-in-out ${currentRoomName !== roomName ? 'md:w-1/2' : 'w-full'} rounded-3xl overflow-hidden shadow-2xl border border-white/5`}>
                    <JitsiMeet
                        roomName={currentRoomName}
                        displayName={studentName}
                        role="student"
                        onMeetingEnd={handleMeetingEnd}
                        onReady={(participantId) => {
                            setLocalParticipantId(participantId);
                            setIsReady(true);
                        }}
                        className="h-full"
                    />
                    
                    {/* Room Indicator Badge */}
                    <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                        <Users className="w-3 h-3 text-cyan-400" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                            {currentRoomName === roomName ? 'Sala Geral' : `Grupo: ${currentRoomName}`}
                        </span>
                    </div>
                </div>

                {/* Broadcast View (Main Room Board) */}
                {currentRoomName !== roomName && (
                    <div className="md:w-1/2 h-full animate-in slide-in-from-right duration-700 ease-out">
                        <BroadcastView
                            roomName={roomName}
                            displayName={studentName}
                            isActive={true}
                        />
                    </div>
                )}
            </div>

            {/* AI Quiz Modal Overlay */}
            {currentQuiz && (
                <QuizModal
                    question={currentQuiz}
                    onSubmit={(index) => {
                        console.log('[Student] Answered quiz:', index);
                        // Future: Send result back to teacher
                    }}
                    onClose={() => setCurrentQuiz(null)}
                />
            )}
            {/* Reaction Overlay - State of the Art Feature */}
            {activeReaction && (
                <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[200]">
                    <div className="text-[150px] animate-bounce-slow filter drop-shadow-2xl">
                        {activeReaction}
                    </div>
                </div>
            )}
        </div>
    );
}
