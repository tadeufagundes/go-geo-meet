import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Plus, Calendar, Users, Play, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSessions } from '../hooks/useSessions';
import * as sessionService from '../services/sessionService';

export function TeacherDashboard() {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const { sessions, isLoading: isLoadingSessions, error, fetchSessions } = useSessions();

    const [isCreating, setIsCreating] = useState(false);
    const [newSessionTurma, setNewSessionTurma] = useState('');

    // Redirect if not authenticated
    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    const handleCreateSession = async () => {
        if (!newSessionTurma.trim()) return;

        setIsCreating(true);
        try {
            const turmaId = `turma-${Date.now()}`;
            const response = await sessionService.createSession(turmaId, newSessionTurma);

            // Start and navigate to the room
            await sessionService.startSession(response.id);
            navigate(`/teacher/room/${response.jitsiRoomName}?turma=${encodeURIComponent(newSessionTurma)}&sessionId=${response.id}`);
        } catch (err) {
            console.error('Error creating session:', err);
            alert('Erro ao criar sessão');
        } finally {
            setIsCreating(false);
        }
    };

    const handleStartSession = async (session: { id: string; turmaName: string; jitsiRoomName: string }) => {
        try {
            await sessionService.startSession(session.id);
            navigate(`/teacher/room/${session.jitsiRoomName}?turma=${encodeURIComponent(session.turmaName)}&sessionId=${session.id}`);
        } catch (err) {
            console.error('Error starting session:', err);
            alert('Erro ao iniciar sessão');
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            return `Hoje às ${formatTime(dateStr)}`;
        }
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-navy-900 text-white">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center">
                            <Video className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Go Geo Meet</h1>
                            <p className="text-sm text-gray-400">Olá, {user?.displayName || user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sair
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Quick Create */}
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Iniciar Nova Aula
                    </h2>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={newSessionTurma}
                            onChange={(e) => setNewSessionTurma(e.target.value)}
                            placeholder="Nome da turma (ex: Matemática 7A)"
                            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateSession()}
                        />
                        <button
                            onClick={handleCreateSession}
                            disabled={isCreating || !newSessionTurma.trim()}
                            className="flex items-center gap-2 bg-cyan-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCreating ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Plus className="w-5 h-5" />
                                    Criar e Iniciar
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Sessions List */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Suas Aulas
                        </h2>
                        <button
                            onClick={fetchSessions}
                            disabled={isLoadingSessions}
                            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoadingSessions ? 'animate-spin' : ''}`} />
                            Atualizar
                        </button>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {sessions.length === 0 && !isLoadingSessions ? (
                        <div className="p-12 text-center text-gray-500">
                            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhuma aula encontrada</p>
                            <p className="text-sm mt-1">Crie sua primeira aula acima</p>
                        </div>
                    ) : (
                        <ul className="divide-y">
                            {sessions.map((session) => (
                                <li
                                    key={session.id}
                                    className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${session.status === 'live'
                                            ? 'bg-green-100'
                                            : session.status === 'completed'
                                                ? 'bg-gray-100'
                                                : 'bg-navy-100'
                                            }`}>
                                            <Video className={`w-6 h-6 ${session.status === 'live'
                                                ? 'text-green-600'
                                                : session.status === 'completed'
                                                    ? 'text-gray-400'
                                                    : 'text-navy-600'
                                                }`} />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">
                                                {session.turmaName}
                                            </h3>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(session.scheduledAt)}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${session.status === 'live'
                                                    ? 'bg-green-100 text-green-700'
                                                    : session.status === 'completed'
                                                        ? 'bg-gray-100 text-gray-600'
                                                        : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {session.status === 'live' ? 'Ao Vivo' : session.status === 'completed' ? 'Encerrada' : 'Agendada'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {session.status !== 'completed' && (
                                        <button
                                            onClick={() => handleStartSession(session)}
                                            className="flex items-center gap-2 bg-navy-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-navy-800 transition-colors"
                                        >
                                            <Play className="w-4 h-4" />
                                            {session.status === 'live' ? 'Entrar' : 'Iniciar'}
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </main>
        </div>
    );
}
