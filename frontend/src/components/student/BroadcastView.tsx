import { useEffect, useRef, useState } from 'react';
import { EMBEDDABLE_JITSI_SERVERS } from '@/config/jitsiServers';

interface BroadcastViewProps {
    roomName: string;
    displayName: string;
    isActive: boolean;
    domain?: string;
}

/**
 * BroadcastView - Displays a secondary Jitsi stream (the "Quadro").
 * 
 * Used by students while in breakout rooms to see the teacher's main share.
 */
export function BroadcastView({ roomName, displayName, isActive, domain }: BroadcastViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<any>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!isActive || !containerRef.current || apiRef.current) return;

        const initJitsi = () => {
            if (!(window as any).JitsiMeetExternalAPI) {
                setTimeout(initJitsi, 100);
                return;
            }

            const jitsiDomain = domain || EMBEDDABLE_JITSI_SERVERS[0];
            const api = new (window as any).JitsiMeetExternalAPI(jitsiDomain, {
                roomName,
                parentNode: containerRef.current,
                width: '100%',
                height: '100%',
                userInfo: { displayName: `${displayName} (Monitor)` },
                configOverwrite: {
                    prejoinPageEnabled: false,
                    startWithAudioMuted: true, // IMPORTANT: No audio to prevent echo
                    startWithVideoMuted: true, // We only want to see the teacher's share
                    disableDeepLinking: true,
                    // Hide everything else
                    hideConferenceSubject: true,
                    hideConferenceTimer: true,
                    toolbarButtons: [], 
                },
                interfaceConfigOverwrite: {
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_POWERED_BY: false,
                    TOOLBAR_BUTTONS: [],
                    filmStripOnly: false,
                    VERTICAL_FILMSTRIP: false,
                },
            });

            api.addListener('videoConferenceJoined', () => setIsLoaded(true));
            apiRef.current = api;
        };

        initJitsi();

        return () => {
            if (apiRef.current) {
                apiRef.current.dispose();
                apiRef.current = null;
            }
        };
    }, [displayName, domain, isActive, roomName]);

    if (!isActive) return null;

    return (
        <div className="relative border-4 border-cyan-500 rounded-xl overflow-hidden bg-black shadow-2xl">
            <div className="absolute top-2 left-2 z-10 bg-cyan-500 text-white px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                Quadro do Professor
            </div>
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
                    Carregando quadro...
                </div>
            )}
            <div ref={containerRef} className="w-full h-full" />
        </div>
    );
}
