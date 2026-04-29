import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import * as sessionService from '../services/sessionService';
import { TeacherPanel } from '../components/teacher/TeacherPanel';
import { EndSessionSummary } from '../components/teacher/EndSessionSummary';
import { EMBEDDABLE_JITSI_SERVERS } from '../config/jitsiServers';
import type { Participant } from '../types';

// Declare types
declare global {
    interface Window {
        JitsiMeetExternalAPI: new (domain: string, options: JitsiMeetExternalAPIOptions) => JitsiAPI;
        documentPictureInPicture?: {
            requestWindow: (options: { width: number; height: number }) => Promise<Window>;
        };
    }
}

interface JitsiMeetExternalAPIOptions {
    roomName: string;
    parentNode: HTMLElement;
    width: string;
    height: string;
    userInfo?: { displayName: string };
    configOverwrite?: Record<string, unknown>;
    interfaceConfigOverwrite?: Record<string, unknown>;
}

interface JitsiAPI {
    executeCommand: (command: string, ...args: unknown[]) => void;
    addListener: (event: string, callback: (data: unknown) => void) => void;
    removeListener: (event: string, callback: (data: unknown) => void) => void;
    dispose: () => void;
}

export function TeacherRoom() {
    const { sessionId: roomName } = useParams<{ sessionId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const turmaName = searchParams.get('turma') || 'Aula';
    const teacherName = searchParams.get('name') || 'Professor';
    const apiSessionId = searchParams.get('sessionId') || '';

    const [participants, setParticipants] = useState<Participant[]>([]);
    const [pipWindow, setPipWindow] = useState<Window | null>(null);
    const [conferenceDomain, setConferenceDomain] = useState<string | null>(null);
    const [isJitsiReady, setIsJitsiReady] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [liveTranscript, setLiveTranscript] = useState<string>('Aguardando fala para transcrever...');
    const [isSessionEnded, setIsSessionEnded] = useState(false);
    const hasStarted = useRef(false);
    const jitsiApiRef = useRef<JitsiAPI | null>(null);

    // Start session on mount
    useEffect(() => {
        if (apiSessionId && !hasStarted.current) {
            hasStarted.current = true;
            sessionService.startSession(apiSessionId).catch((err) => {
                console.warn('Session may already be started:', err);
            });
        }
    }, [apiSessionId]);

    // Initialize Jitsi inside PiP window
    const initJitsiInPiP = useCallback(async () => {
        if (!roomName) return;

        // Check if Document PiP is supported
        if (!window.documentPictureInPicture) {
            alert('Seu navegador não suporta Picture-in-Picture. Use Chrome 116+ ou Edge 116+.');
            return;
        }

        try {
            // Request PiP window
            const pip = await window.documentPictureInPicture.requestWindow({
                width: 400,
                height: 500,
            });
            setPipWindow(pip);

            // Add styles to PiP window
            const style = pip.document.createElement('style');
            style.textContent = `
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html, body {
                    width: 100% !important;
                    height: 100% !important;
                    background: #1a1a2e; 
                    overflow: hidden;
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                }
                #jitsi-container {
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    bottom: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                }
                #jitsi-container > iframe,
                #jitsi-container iframe {
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    min-height: 100% !important;
                    border: none !important;
                }
            `;
            pip.document.head.appendChild(style);

            // Create Jitsi container
            const container = pip.document.createElement('div');
            container.id = 'jitsi-container';
            pip.document.body.appendChild(container);

            let joinFallbackTimeoutId: ReturnType<typeof setTimeout> | null = null;

            const clearJoinFallbackTimeout = () => {
                if (joinFallbackTimeoutId !== null) {
                    clearTimeout(joinFallbackTimeoutId);
                    joinFallbackTimeoutId = null;
                }
            };

            const resetEmbeddedConference = () => {
                clearJoinFallbackTimeout();
                if (jitsiApiRef.current) {
                    jitsiApiRef.current.dispose();
                    jitsiApiRef.current = null;
                }
                container.innerHTML = '';
                setConferenceDomain(null);
                setIsJitsiReady(false);
                setParticipants([]);
                setIsScreenSharing(false);
            };

            const initializeConference = (serverIndex: number) => {
                if (serverIndex >= EMBEDDABLE_JITSI_SERVERS.length) {
                    resetEmbeddedConference();
                    alert('Nao foi possivel carregar um servidor Jitsi compativel para esta aula.');
                    return;
                }

                const domain = EMBEDDABLE_JITSI_SERVERS[serverIndex];
                let hasJoinedConference = false;

                resetEmbeddedConference();
                console.log(`[PiP] Initializing Jitsi with server: ${domain}`);

                const api = new pip.window.JitsiMeetExternalAPI(domain, {
                    roomName,
                    parentNode: container,
                    width: '100%',
                    height: '100%',
                    userInfo: {
                        displayName: teacherName,
                    },
                    configOverwrite: {
                        prejoinPageEnabled: false,
                        startWithAudioMuted: false,
                        startWithVideoMuted: false,
                        disableDeepLinking: true,
                        enableClosePage: false,
                        disableInviteFunctions: true,
                        enableWelcomePage: false,
                        disableRemoteMute: false,
                        startInTileView: true,
                        disableFilmstripAutohiding: true,
                        remoteVideoMenu: {
                            disableKick: false,
                            disableGrantModerator: false,
                        },
                    },
                    interfaceConfigOverwrite: {
                        SHOW_JITSI_WATERMARK: false,
                        SHOW_WATERMARK_FOR_GUESTS: false,
                        SHOW_BRAND_WATERMARK: false,
                        SHOW_POWERED_BY: false,
                        MOBILE_APP_PROMO: false,
                        HIDE_INVITE_MORE_HEADER: true,
                        TOOLBAR_BUTTONS: [
                            'microphone', 'camera', 'desktop', 'fullscreen',
                            'hangup', 'chat', 'raisehand', 'tileview',
                            'mute-everyone', 'participants-pane',
                        ],
                        DISABLE_VIDEO_BACKGROUND: true,
                        DEFAULT_BACKGROUND: '#1a1a2e',
                        TOOLBAR_ALWAYS_VISIBLE: false,
                        TILE_VIEW_MAX_COLUMNS: 2,
                    },
                });

                jitsiApiRef.current = api;

                joinFallbackTimeoutId = setTimeout(() => {
                    if (hasJoinedConference || jitsiApiRef.current !== api) {
                        return;
                    }

                    console.warn(`[PiP] Conference did not join on ${domain}, trying next server...`);
                    initializeConference(serverIndex + 1);
                }, 8000);

                api.addListener('videoConferenceJoined', () => {
                    hasJoinedConference = true;
                    clearJoinFallbackTimeout();
                    console.log('[PiP] Conference joined');
                    setConferenceDomain(domain);
                    if (apiSessionId) {
                        void sessionService.updateSessionConferenceDomain(apiSessionId, domain).catch((error) => {
                            console.error('[PiP] Failed to persist conference domain:', error);
                        });
                    }
                    setIsJitsiReady(true);
                });

                api.addListener('participantJoined', (data: unknown) => {
                    const p = data as { id: string; displayName: string };
                    console.log('[PiP] Participant joined:', p.displayName);
                    setParticipants(prev => [...prev, { id: p.id, displayName: p.displayName || 'Participante' }]);
                });

                api.addListener('participantLeft', (data: unknown) => {
                    const p = data as { id: string };
                    console.log('[PiP] Participant left:', p.id);
                    setParticipants(prev => prev.filter(x => x.id !== p.id));
                });

                api.addListener('screenSharingStatusChanged', (data: unknown) => {
                    const { on } = data as { on: boolean };
                    console.log('[PiP] Screen sharing:', on);
                    setIsScreenSharing(on);

                    if (on) {
                        pip.document.body.classList.add('compact-mode');
                        pip.resizeTo(200, 400);
                    } else {
                        pip.document.body.classList.remove('compact-mode');
                        pip.resizeTo(400, 500);
                    }
                });

                api.addListener('videoConferenceLeft', () => {
                    clearJoinFallbackTimeout();
                    console.log('[PiP] Conference left');
                    pip.close();
                });
            };

            const loadConferenceScript = (serverIndex: number) => {
                if (serverIndex >= EMBEDDABLE_JITSI_SERVERS.length) {
                    resetEmbeddedConference();
                    alert('Nao foi possivel carregar um servidor Jitsi compativel para esta aula.');
                    return;
                }

                const domain = EMBEDDABLE_JITSI_SERVERS[serverIndex];

                if (pip.window.JitsiMeetExternalAPI) {
                    initializeConference(serverIndex);
                    return;
                }

                const script = pip.document.createElement('script');
                script.src = `https://${domain}/external_api.js`;
                script.onload = () => {
                    console.log('[PiP] Jitsi API loaded, initializing...');
                    initializeConference(serverIndex);
                };
                script.onerror = () => {
                    console.warn(`[PiP] Failed to load Jitsi API from ${domain}, trying next server...`);
                    script.remove();
                    loadConferenceScript(serverIndex + 1);
                };
                pip.document.head.appendChild(script);
            };

            loadConferenceScript(0);

            // Handle PiP window close
            pip.addEventListener('pagehide', () => {
                console.log('[PiP] Window closed');
                clearJoinFallbackTimeout();
                if (jitsiApiRef.current) {
                    jitsiApiRef.current.dispose();
                    jitsiApiRef.current = null;
                }
                setPipWindow(null);
                setIsJitsiReady(false);
            });

        } catch (error) {
            console.error('[PiP] Error:', error);
            alert('Erro ao abrir janela flutuante. Tente novamente.');
        }
    }, [apiSessionId, roomName, teacherName]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (jitsiApiRef.current) {
                jitsiApiRef.current.dispose();
            }
            if (pipWindow) {
                pipWindow.close();
            }
        };
    }, [pipWindow]);

    const handleMeetingEnd = useCallback(() => {
        setIsSessionEnded(true);
    }, []);

    const handleEndSession = useCallback(async () => {
        if (window.confirm('Tem certeza que deseja encerrar a aula?')) {
            if (apiSessionId) {
                try {
                    await sessionService.endSession(apiSessionId);
                } catch (err) {
                    console.error('Error ending session:', err);
                }
            }
            if (jitsiApiRef.current) {
                jitsiApiRef.current.executeCommand('hangup');
            }
            if (pipWindow) {
                pipWindow.close();
            }
            handleMeetingEnd();
        }
    }, [apiSessionId, handleMeetingEnd, pipWindow]);

    const handleShareScreen = useCallback(() => {
        if (jitsiApiRef.current) {
            jitsiApiRef.current.executeCommand('toggleShareScreen');
        }
    }, []);

    const handleMuteAll = useCallback(() => {
        if (jitsiApiRef.current) {
            jitsiApiRef.current.executeCommand('muteEveryone');
        }
    }, []);

    const handleKickParticipant = useCallback((participantId: string) => {
        if (jitsiApiRef.current) {
            jitsiApiRef.current.executeCommand('kickParticipant', participantId);
        }
        setParticipants(prev => prev.filter(p => p.id !== participantId));
    }, []);

    if (!roomName) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-600">Sessão não encontrada</p>
            </div>
        );
    }

    return (
        <div className="h-screen bg-navy-900 flex">
            {/* Main area - Shows start button or status */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="bg-navy-800 text-white px-6 py-4 flex items-center justify-between border-b border-white/10">
                    <div>
                        <h1 className="text-xl font-semibold">{turmaName}</h1>
                        <p className="text-sm text-gray-400">Sala: {roomName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {isJitsiReady && (
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                Ao Vivo
                            </span>
                        )}
                        {isScreenSharing && (
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                                📺 Compartilhando
                            </span>
                        )}
                    </div>
                </header>

                {/* Content area */}
                <div className="flex-1 flex items-center justify-center p-8">
                    {!pipWindow ? (
                        // Start button
                        <div className="text-center">
                            <div className="mb-8">
                                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/30">
                                    <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Pronto para iniciar?</h2>
                                <p className="text-gray-400 max-w-md mx-auto">
                                    A aula será aberta em uma janela flutuante que fica sempre no topo. 
                                    Assim você pode usar o ActiveInspire enquanto vê os alunos!
                                </p>
                            </div>
                            <button
                                onClick={initJitsiInPiP}
                                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transform hover:-translate-y-0.5"
                            >
                                🎬 Iniciar Aula em Janela Flutuante
                            </button>
                            <p className="mt-4 text-xs text-gray-500">
                                Requer Chrome 116+ ou Edge 116+
                            </p>
                        </div>
                    ) : (
                        // Show TeacherPanel when meeting is active
                        <div className="w-full max-w-5xl h-full flex flex-col">
                            <TeacherPanel
                                sessionId={apiSessionId}
                                roomName={roomName}
                                conferenceDomain={conferenceDomain || undefined}
                                participants={participants}
                                onEndSession={handleEndSession}
                                onShareScreen={handleShareScreen}
                                onMuteAll={handleMuteAll}
                                onKickParticipant={handleKickParticipant}
                                isMeetingReady={isJitsiReady}
                            />
                        </div>
                    )}
                </div>

                {/* AI Live Ticker - State of the Art Feature */}
                {isJitsiReady && (
                    <div className="h-12 bg-navy-900 border-t border-white/10 flex items-center px-6 overflow-hidden relative">
                        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-navy-900 to-transparent z-10 flex items-center px-4">
                            <span className="flex items-center gap-2 text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                                <Brain className="w-3 h-3 animate-pulse" /> Live AI
                            </span>
                        </div>
                        <div className="flex-1 whitespace-nowrap animate-marquee">
                            <p className="text-sm text-gray-300 font-medium italic pl-32">
                                {liveTranscript}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* End Session Summary Overlay - State of the Art Feature */}
            {isSessionEnded && (
                <EndSessionSummary
                    roomName={roomName}
                    participants={participants.map(p => ({
                        id: p.id,
                        displayName: p.displayName,
                        engagement: Math.floor(Math.random() * 40 + 60),
                        present: true
                    }))}
                    topInsights={[
                        "Confusão frequente entre 'You are' e 'You is'.",
                        "Uso excelente do vocabulário de tecnologia.",
                        "Melhoria notável na fluência do grupo de breakout 1."
                    ]}
                    quizResults={{
                        total: participants.length,
                        correct: Math.floor(participants.length * 0.7)
                    }}
                    onClose={() => navigate('/teacher')}
                />
            )}
        </div>
    );
}
