import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { JitsiMeet } from '../components/jitsi/JitsiMeet';
import { TeacherPanel } from '../components/teacher/TeacherPanel';
import * as sessionService from '../services/sessionService';
import type { Participant } from '../types';

// Declare Jitsi API type for commands
declare global {
    interface Window {
        jitsiApi?: {
            executeCommand: (command: string, ...args: unknown[]) => void;
        };
    }
}

export function TeacherRoom() {
    const { sessionId: roomName } = useParams<{ sessionId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const turmaName = searchParams.get('turma') || 'Aula';
    const teacherName = searchParams.get('name') || 'Professor';
    const apiSessionId = searchParams.get('sessionId') || '';

    const [participants, setParticipants] = useState<Participant[]>([]);
    const hasStarted = useRef(false);
    const jitsiApiRef = useRef<{ executeCommand: (command: string, ...args: unknown[]) => void } | null>(null);

    // Start session on mount
    useEffect(() => {
        if (apiSessionId && !hasStarted.current) {
            hasStarted.current = true;
            sessionService.startSession(apiSessionId).catch((err) => {
                console.warn('Session may already be started:', err);
            });
        }
    }, [apiSessionId]);

    const handleParticipantJoined = useCallback((participant: Participant) => {
        console.log('Participante entrou:', participant.displayName);
        setParticipants((prev) => [...prev, participant]);
    }, []);

    const handleParticipantLeft = useCallback((participantId: string) => {
        console.log('Participante saiu:', participantId);
        setParticipants((prev) => prev.filter((p) => p.id !== participantId));
    }, []);

    const handleMeetingEnd = useCallback(() => {
        navigate('/teacher');
    }, [navigate]);

    const handleEndSession = useCallback(async () => {
        if (window.confirm('Tem certeza que deseja encerrar a aula?')) {
            if (apiSessionId) {
                try {
                    await sessionService.endSession(apiSessionId);
                } catch (err) {
                    console.error('Error ending session:', err);
                }
            }
            handleMeetingEnd();
        }
    }, [apiSessionId, handleMeetingEnd]);

    // Store Jitsi API reference when ready
    const handleJitsiReady = useCallback(() => {
        // The Jitsi API is stored on window by our useJitsi hook
        // We need to access it through the iframe
        const iframe = document.querySelector('iframe[name="jitsiConferenceFrame"]') as HTMLIFrameElement;
        if (iframe) {
            // Store reference to execute commands
            jitsiApiRef.current = window.jitsiApi || null;
        }
        console.log('[TeacherRoom] Jitsi ready');
    }, []);

    // Moderator controls
    const handleShareScreen = useCallback(() => {
        console.log('[TeacherRoom] Toggle share screen');
        // The share screen is handled directly by Jitsi toolbar
        // This is just for UI feedback in the panel
    }, []);

    const handleMuteAll = useCallback(() => {
        console.log('[TeacherRoom] Mute everyone');
        // Execute mute command if API is available
        if (jitsiApiRef.current) {
            jitsiApiRef.current.executeCommand('muteEveryone');
        }
    }, []);

    const handleKickParticipant = useCallback((participantId: string) => {
        console.log('[TeacherRoom] Kick participant:', participantId);
        if (jitsiApiRef.current) {
            jitsiApiRef.current.executeCommand('kickParticipant', participantId);
        }
        // Also remove from local state
        setParticipants((prev) => prev.filter((p) => p.id !== participantId));
    }, []);

    if (!roomName) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-600">Sessão não encontrada</p>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-900 flex">
            {/* Main video area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="bg-navy-900 text-white px-4 py-3 flex items-center justify-between">
                    <div>
                        <h1 className="font-semibold">{turmaName}</h1>
                        <p className="text-sm text-gray-400">Sala: {roomName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            Ao Vivo
                        </span>
                    </div>
                </header>

                {/* Jitsi container */}
                <div className="flex-1">
                    <JitsiMeet
                        roomName={roomName}
                        displayName={teacherName}
                        role="teacher"
                        onParticipantJoined={handleParticipantJoined}
                        onParticipantLeft={handleParticipantLeft}
                        onMeetingEnd={handleMeetingEnd}
                        onReady={handleJitsiReady}
                        className="h-full"
                    />
                </div>
            </div>

            {/* Teacher panel */}
            <TeacherPanel
                sessionId={apiSessionId || roomName}
                participants={participants}
                onEndSession={handleEndSession}
                onShareScreen={handleShareScreen}
                onMuteAll={handleMuteAll}
                onKickParticipant={handleKickParticipant}
            />
        </div>
    );
}

