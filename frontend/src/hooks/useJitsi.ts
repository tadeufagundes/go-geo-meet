import { useEffect, useRef, useCallback, useState } from 'react';
import type { Participant } from '@/types';

interface UseJitsiOptions {
    roomName: string;
    displayName: string;
    password?: string;
    onParticipantJoined?: (participant: Participant) => void;
    onParticipantLeft?: (participantId: string) => void;
    onMeetingEnd?: () => void;
    onReady?: () => void;
}

export function useJitsi(containerRef: React.RefObject<HTMLElement>, options: UseJitsiOptions) {
    const apiRef = useRef<JitsiMeetExternalAPI | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [participants, setParticipants] = useState<Participant[]>([]);

    const {
        roomName,
        displayName,
        password,
        onParticipantJoined,
        onParticipantLeft,
        onMeetingEnd,
        onReady,
    } = options;

    const initJitsi = useCallback(() => {
        if (!containerRef.current || apiRef.current) return;

        const domain = 'meet.jit.si';

        const api = new window.JitsiMeetExternalAPI(domain, {
            roomName,
            parentNode: containerRef.current,
            width: '100%',
            height: '100%',
            userInfo: {
                displayName,
            },
            configOverwrite: {
                prejoinPageEnabled: false,
                startWithAudioMuted: true,
                startWithVideoMuted: false,
                disableDeepLinking: true,
                enableClosePage: false,
                disableInviteFunctions: true,
            },
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
                TOOLBAR_BUTTONS: [
                    'microphone',
                    'camera',
                    'closedcaptions',
                    'desktop',
                    'fullscreen',
                    'fodeviceselection',
                    'hangup',
                    'chat',
                    'raisehand',
                    'videoquality',
                    'filmstrip',
                    'tileview',
                    'settings',
                ],
            },
        });

        // Set password if provided
        if (password) {
            api.addListener('participantRoleChanged', (event: { role: string }) => {
                if (event.role === 'moderator') {
                    api.executeCommand('password', password);
                }
            });
        }

        // Video conference ready
        api.addListener('videoConferenceJoined', () => {
            setIsReady(true);
            onReady?.();
        });

        // Participant joined
        api.addListener('participantJoined', (event: { id: string; displayName: string }) => {
            const participant: Participant = {
                id: event.id,
                displayName: event.displayName,
            };
            setParticipants((prev) => [...prev, participant]);
            onParticipantJoined?.(participant);
        });

        // Participant left
        api.addListener('participantLeft', (event: { id: string }) => {
            setParticipants((prev) => prev.filter((p) => p.id !== event.id));
            onParticipantLeft?.(event.id);
        });

        // Meeting ended
        api.addListener('readyToClose', () => {
            onMeetingEnd?.();
        });

        apiRef.current = api;
    }, [roomName, displayName, password, onParticipantJoined, onParticipantLeft, onMeetingEnd, onReady, containerRef]);

    const dispose = useCallback(() => {
        if (apiRef.current) {
            apiRef.current.dispose();
            apiRef.current = null;
            setIsReady(false);
            setParticipants([]);
        }
    }, []);

    const hangup = useCallback(() => {
        apiRef.current?.executeCommand('hangup');
    }, []);

    const toggleAudio = useCallback(() => {
        apiRef.current?.executeCommand('toggleAudio');
    }, []);

    const toggleVideo = useCallback(() => {
        apiRef.current?.executeCommand('toggleVideo');
    }, []);

    useEffect(() => {
        // Wait for Jitsi API to load
        const checkJitsiAPI = () => {
            if (window.JitsiMeetExternalAPI) {
                initJitsi();
            } else {
                setTimeout(checkJitsiAPI, 100);
            }
        };
        checkJitsiAPI();

        return () => {
            dispose();
        };
    }, [initJitsi, dispose]);

    return {
        api: apiRef.current,
        isReady,
        participants,
        hangup,
        toggleAudio,
        toggleVideo,
        dispose,
    };
}
