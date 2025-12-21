import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { TeacherPanel } from '../components/teacher/TeacherPanel';
import * as sessionService from '../services/sessionService';
import type { Participant } from '../types';

// Jitsi server configuration
const JITSI_SERVERS = [
    'meet.ffmuc.net',
    'jitsi.hamburg.ccc.de',
];

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
    const [isJitsiReady, setIsJitsiReady] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
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
                body { 
                    background: #1a1a2e; 
                    overflow: hidden;
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                }
                #jitsi-container {
                    width: 100%;
                    height: 100%;
                }
                iframe {
                    width: 100% !important;
                    height: 100% !important;
                    border: none;
                }
                /* Compact mode styles when screen sharing */
                body.compact-mode #jitsi-container {
                    width: 100%;
                    height: 100%;
                }
            `;
            pip.document.head.appendChild(style);

            // Create Jitsi container
            const container = pip.document.createElement('div');
            container.id = 'jitsi-container';
            pip.document.body.appendChild(container);

            // Load Jitsi External API script
            const domain = JITSI_SERVERS[0];
            const script = pip.document.createElement('script');
            script.src = `https://${domain}/external_api.js`;
            script.onload = () => {
                console.log('[PiP] Jitsi API loaded, initializing...');
                
                // Initialize Jitsi Meet
                const api = new pip.window.JitsiMeetExternalAPI(domain, {
                    roomName: roomName,
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
                        // Force tile view as default (fills the whole window)
                        startInTileView: true,
                        // Disable filmstrip to maximize video space
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
                        // Remove filmstrip constraints - let tile view use full space
                        DISABLE_VIDEO_BACKGROUND: true,
                        DEFAULT_BACKGROUND: '#1a1a2e',
                        TOOLBAR_ALWAYS_VISIBLE: false,
                        // Force tile view layout
                        TILE_VIEW_MAX_COLUMNS: 2,
                    },
                });

                jitsiApiRef.current = api;

                // Listen for conference joined
                api.addListener('videoConferenceJoined', () => {
                    console.log('[PiP] Conference joined');
                    setIsJitsiReady(true);
                });

                // Listen for participants
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

                // Listen for screen sharing status
                api.addListener('screenSharingStatusChanged', (data: unknown) => {
                    const { on } = data as { on: boolean };
                    console.log('[PiP] Screen sharing:', on);
                    setIsScreenSharing(on);
                    
                    // Toggle compact mode
                    if (on) {
                        pip.document.body.classList.add('compact-mode');
                        pip.resizeTo(200, 400); // Narrow filmstrip
                    } else {
                        pip.document.body.classList.remove('compact-mode');
                        pip.resizeTo(400, 500); // Normal size
                    }
                });

                // Listen for hangup
                api.addListener('videoConferenceLeft', () => {
                    console.log('[PiP] Conference left');
                    pip.close();
                });
            };
            pip.document.head.appendChild(script);

            // Handle PiP window close
            pip.addEventListener('pagehide', () => {
                console.log('[PiP] Window closed');
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
    }, [roomName, teacherName]);

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
                        // Status when PiP is active
                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                                <span className="text-4xl">✅</span>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Aula em andamento</h2>
                            <p className="text-gray-400 mb-4">
                                {participants.length} aluno{participants.length !== 1 ? 's' : ''} na sala
                            </p>
                            <p className="text-sm text-gray-500">
                                A janela flutuante está ativa. Você pode minimizar este navegador e usar o ActiveInspire.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Teacher panel */}
            <TeacherPanel
                sessionId={apiSessionId || roomName}
                roomName={roomName}
                participants={participants}
                onEndSession={handleEndSession}
                onShareScreen={handleShareScreen}
                onMuteAll={handleMuteAll}
                onKickParticipant={handleKickParticipant}
            />
        </div>
    );
}
