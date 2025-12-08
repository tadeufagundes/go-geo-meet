import { useCallback, useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { JitsiMeet } from '../components/jitsi/JitsiMeet';
import { FeedbackButton } from '../components/student/FeedbackButton';
import { Video, LogOut } from 'lucide-react';
import * as attendanceService from '../services/attendanceService';

export function StudentRoom() {
    const { sessionId: roomName } = useParams<{ sessionId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const studentName = searchParams.get('name') || 'Aluno';
    const apiSessionId = searchParams.get('sessionId') || roomName || '';

    const [isReady, setIsReady] = useState(false);
    const [attendanceId, setAttendanceId] = useState<string | null>(null);
    const [studentId] = useState(() => `student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    const hasJoined = useRef(false);

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

    const handleMeetingEnd = useCallback(async () => {
        // Record leave
        if (apiSessionId && attendanceId) {
            try {
                await attendanceService.leaveSession(apiSessionId, attendanceId);
            } catch (err) {
                console.error('Error recording leave:', err);
            }
        }
        navigate('/login');
    }, [apiSessionId, attendanceId, navigate]);

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
        <div className="h-screen bg-gray-900 flex flex-col">
            {/* Header */}
            <header className="bg-navy-900 text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
                        <Video className="w-4 h-4" />
                    </div>
                    <div>
                        <h1 className="font-semibold">Go Geo Meet</h1>
                        <p className="text-sm text-gray-400">Olá, {studentName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
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
                        className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        aria-label="Sair da aula"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="hidden sm:inline">Sair</span>
                    </button>
                </div>
            </header>

            {/* Jitsi container */}
            <div className="flex-1">
                <JitsiMeet
                    roomName={roomName}
                    displayName={studentName}
                    role="student"
                    onMeetingEnd={handleMeetingEnd}
                    onReady={() => setIsReady(true)}
                    className="h-full"
                />
            </div>
        </div>
    );
}
