import { useEffect, useRef, useCallback, useState } from 'react';
import type { Participant } from '@/types';

interface UseJitsiOptions {
    roomName: string;
    displayName: string;
    password?: string;
    role?: 'teacher' | 'student';
    onParticipantJoined?: (participant: Participant) => void;
    onParticipantLeft?: (participantId: string) => void;
    onMeetingEnd?: () => void;
    onReady?: () => void;
}

/**
 * Hook para integração com Jitsi Meet External API
 * 
 * Controles por role:
 * - TEACHER: Moderador, pode compartilhar tela, silenciar todos, etc.
 * - STUDENT: Participante limitado, SEM compartilhar tela
 */
export function useJitsi(containerRef: React.RefObject<HTMLElement>, options: UseJitsiOptions) {
    const apiRef = useRef<JitsiMeetExternalAPI | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [currentDomain, setCurrentDomain] = useState<string>('');

    const {
        roomName,
        displayName,
        password,
        role = 'student',
        onParticipantJoined,
        onParticipantLeft,
        onMeetingEnd,
        onReady,
    } = options;

    const isTeacher = role === 'teacher';

    const initJitsi = useCallback((domain: string) => {
        console.log(`[Jitsi] Initializing with server: ${domain}`);
        if (!containerRef.current || apiRef.current) return;

        setCurrentDomain(domain);

        // ============================================
        // Configurações diferenciadas por ROLE
        // ============================================
        
        // Botões da toolbar - Professor tem TUDO, Aluno tem LIMITADO
        const teacherToolbarButtons = [
            'microphone',
            'camera',
            'desktop',           // Compartilhar tela
            'fullscreen',
            'fodeviceselection',
            'hangup',
            'chat',
            'raisehand',
            'videoquality',
            'filmstrip',
            'tileview',
            'settings',
            'mute-everyone',     // Silenciar todos
            'mute-video-everyone', // Desligar vídeo de todos
            'participants-pane', // Painel de participantes
            'security',          // Configurações de segurança
        ];

        const studentToolbarButtons = [
            'microphone',
            // 'camera' REMOVIDO - Aluno não pode desligar camera (solicitação do usuário)
            // 'desktop' REMOVIDO - Aluno NÃO pode compartilhar tela
            'fullscreen',
            'fodeviceselection',
            'hangup',
            'chat',
            'raisehand',
            'videoquality',
            'filmstrip',
            'tileview',
            'settings',
        ];



        // Config overwrite - Permissões do Jitsi
        const baseConfig = {
            // Desabilitar prejoin de todas as formas possíveis
            prejoinPageEnabled: false,
            prejoinConfig: {
                enabled: false,
                hideExtraJoinButtons: ['no-audio', 'by-phone']
            },
            startWithAudioMuted: true,
            startWithVideoMuted: false,
            startAudioOnly: false,           // FORÇAR: Não iniciar em modo audio-only
            disableAudioLevels: false,
            disableDeepLinking: true,
            enableClosePage: false,
            disableInviteFunctions: true,
            enableWelcomePage: false,
            enableNoisyMicDetection: true,
            // IMPORTANTE: Garantir que vídeo seja solicitado
            constraints: {
                video: {
                    height: {
                        ideal: 720,
                        max: 1080,
                        min: 240
                    }
                }
            },
            // Configurações de lobby e autenticação
            lobby: {
                autoKnock: true,
                enableChat: false
            },
            enableLobbyChat: false,
            hideLobbyButton: true,
            // Configurações de moderação
            disableRemoteMute: !isTeacher,  // Apenas professor pode mutar outros
            remoteVideoMenu: {
                disableKick: !isTeacher,      // Apenas professor pode remover
                disableGrantModerator: !isTeacher, // Apenas professor pode promover
                disablePrivateChat: false,
            },
        };

        // Config específico para alunos (mais restritivo)
        const studentConfig = {
            ...baseConfig,
            // Desabilitar funções que apenas o professor deveria ter
            toolbarButtons: studentToolbarButtons,
            // Esconder botões de compartilhar tela completamente
            disableScreenSharingForGuests: true,
        };

        // Config específico para professor (todas as permissões)
        const teacherConfig = {
            ...baseConfig,
            toolbarButtons: teacherToolbarButtons,
            // Professor tem controle total
            disableScreenSharingForGuests: false,
        };

        const configOverwrite = isTeacher ? teacherConfig : studentConfig;

        const api = new window.JitsiMeetExternalAPI(domain, {
            roomName,
            parentNode: containerRef.current,
            width: '100%',
            height: '100%',
            userInfo: {
                displayName,
            },
            configOverwrite,
            interfaceConfigOverwrite: {
                SHOW_JITSI_WATERMARK: false,
                SHOW_WATERMARK_FOR_GUESTS: false,
                SHOW_BRAND_WATERMARK: false,
                BRAND_WATERMARK_LINK: '',
                SHOW_POWERED_BY: false,
                SHOW_PROMOTIONAL_CLOSE_PAGE: false,
                DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
                MOBILE_APP_PROMO: false,
                HIDE_INVITE_MORE_HEADER: true,
                // Definir botões da toolbar baseado no role
                TOOLBAR_BUTTONS: isTeacher ? teacherToolbarButtons : studentToolbarButtons,
                // Esconder menu de convidar para alunos
                DISABLE_VIDEO_BACKGROUND: false,
                FILM_STRIP_MAX_HEIGHT: 120,
                // Configurações visuais
                DEFAULT_BACKGROUND: '#1a1a2e',
                DEFAULT_REMOTE_DISPLAY_NAME: 'Participante',
                DEFAULT_LOCAL_DISPLAY_NAME: 'Eu',
                // Esconder opções de gravação para alunos
                TOOLBAR_ALWAYS_VISIBLE: true,
            },
        });

        // ============================================
        // Event Listeners
        // ============================================

        // Set password se for professor e tiver senha
        if (password && isTeacher) {
            api.addListener('participantRoleChanged', ((event: { id: string; role: string }) => {
                if (event.role === 'moderator') {
                    api.executeCommand('password', password);
                    console.log('[Jitsi] Password set by moderator');
                }
            }) as unknown as () => void);
        }

        // Quando o professor entrar, torná-lo moderador
        api.addListener('videoConferenceJoined', ((event: { id: string }) => {
            console.log('[Jitsi] videoConferenceJoined event fired', event);
            setIsReady(true);
            
            if (isTeacher) {
                // Professor recebe status de moderador automaticamente se for o primeiro
                console.log('[Jitsi] Teacher joined as:', event.id);
            }
            
            onReady?.();
        }) as unknown as () => void);

        // Failsafe: Se o evento não disparar em 5 segundos, libera a tela
        setTimeout(() => {
            setIsReady((prev) => {
                if (!prev) {
                    console.warn('[Jitsi] Failsafe: forcing ready state after 5s');
                    return true;
                }
                return prev;
            });
        }, 5000);

        // Participant joined
        api.addListener('participantJoined', ((event: { id: string; displayName: string }) => {
            const participant: Participant = {
                id: event.id,
                displayName: event.displayName || 'Participante',
            };
            setParticipants((prev) => [...prev, participant]);
            onParticipantJoined?.(participant);
            console.log('[Jitsi] Participant joined:', participant.displayName);
        }) as unknown as () => void);

        // Participant left
        api.addListener('participantLeft', ((event: { id: string }) => {
            setParticipants((prev) => prev.filter((p) => p.id !== event.id));
            onParticipantLeft?.(event.id);
            console.log('[Jitsi] Participant left:', event.id);
        }) as unknown as () => void);

        // Meeting ended
        api.addListener('readyToClose', () => {
            console.log('[Jitsi] Meeting ended');
            onMeetingEnd?.();
        });

        // Screen sharing started/stopped (para debug)
        api.addListener('screenSharingStatusChanged', ((event: { on: boolean; participantId: string }) => {
            console.log('[Jitsi] Screen sharing:', event.on ? 'started' : 'stopped', 'by', event.participantId);
        }) as unknown as () => void);

        apiRef.current = api as unknown as JitsiMeetExternalAPI;
        
        // Expose API globally for moderator controls
        (window as { jitsiApi?: typeof api }).jitsiApi = api;
    }, [roomName, displayName, password, role, isTeacher, onParticipantJoined, onParticipantLeft, onMeetingEnd, onReady, containerRef]);

    const dispose = useCallback(() => {
        if (apiRef.current) {
            apiRef.current.dispose();
            apiRef.current = null;
            // Clean up global reference
            (window as { jitsiApi?: unknown }).jitsiApi = undefined;
            setIsReady(false);
            setParticipants([]);
        }
    }, []);

    // ============================================
    // Comandos do Professor (Moderador)
    // ============================================

    const hangup = useCallback(() => {
        apiRef.current?.executeCommand('hangup');
    }, []);

    const toggleAudio = useCallback(() => {
        apiRef.current?.executeCommand('toggleAudio');
    }, []);

    const toggleVideo = useCallback(() => {
        apiRef.current?.executeCommand('toggleVideo');
    }, []);

    const toggleShareScreen = useCallback(() => {
        if (!isTeacher) {
            console.warn('[Jitsi] Only teachers can share screen');
            return;
        }
        console.log('[Jitsi] Executing toggleShareScreen');
        apiRef.current?.executeCommand('toggleShareScreen');
    }, [isTeacher]);

    const muteEveryone = useCallback(() => {
        if (!isTeacher) {
            console.warn('[Jitsi] Only teachers can mute everyone');
            return;
        }
        console.log('[Jitsi] Executing muteEveryone');
        apiRef.current?.executeCommand('muteEveryone');
    }, [isTeacher]);

    const muteParticipant = useCallback((participantId: string) => {
        if (!isTeacher) {
            console.warn('[Jitsi] Only teachers can mute participants');
            return;
        }
        // Jitsi não tem comando direto, mas podemos usar a API
        console.log('[Jitsi] Attempting to mute:', participantId);
    }, [isTeacher]);

    const kickParticipant = useCallback((participantId: string) => {
        if (!isTeacher) {
            console.warn('[Jitsi] Only teachers can kick participants');
            return;
        }
        apiRef.current?.executeCommand('kickParticipant', participantId);
    }, [isTeacher]);

    // Server Configuration with Fallback
    // TODO: Resolver questão de servidor (comunitário ou próprio) depois
    const JITSI_SERVERS = [
        'meet.jit.si',                  // Primary: Jitsi Meet oficial (5min demo limit)
        'meet.ffmuc.net',               // Fallback: Freifunk München
    ];

    useEffect(() => {
        let serverIndex = 0;

        // Function to load Jitsi script with fallback
        const loadJitsiScript = (index: number) => {
            if (index >= JITSI_SERVERS.length) {
                console.error('[Jitsi] All servers failed to load');
                return;
            }

            const domain = JITSI_SERVERS[index];
            console.log(`[Jitsi] Attempting to load from: ${domain}`);

            // Check if API already loaded (from previous attempt with same domain)
            if (window.JitsiMeetExternalAPI) {
                initJitsi(domain);
                return;
            }

            const script = document.createElement('script');
            script.src = `https://${domain}/external_api.js`;
            script.async = true;
            
            script.onload = () => {
                console.log(`[Jitsi] Successfully loaded API from: ${domain}`);
                initJitsi(domain);
            };
            
            script.onerror = () => {
                console.warn(`[Jitsi] Failed to load from ${domain}, trying fallback...`);
                document.body.removeChild(script);
                loadJitsiScript(index + 1);
            };
            
            document.body.appendChild(script);
        };

        loadJitsiScript(serverIndex);

        return () => {
            dispose();
        };
    }, [initJitsi, dispose]);

    return {
        api: apiRef.current,
        isReady,
        participants,
        isTeacher,
        // Comandos básicos (todos)
        hangup,
        toggleAudio,
        toggleVideo,
        dispose,
        // Comandos do professor (moderador)
        toggleShareScreen,
        muteEveryone,
        muteParticipant,
        kickParticipant,
    };
}

