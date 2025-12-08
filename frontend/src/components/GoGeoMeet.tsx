import React, { useRef, useEffect, useState, useCallback } from 'react';

// Types
export interface GoGeoMeetProps {
    /**
     * Session ID from the Go Geo Meet API
     */
    sessionId: string;

    /**
     * User's display name
     */
    displayName: string;

    /**
     * User role: 'teacher' or 'student'
     */
    role: 'teacher' | 'student';

    /**
     * Jitsi room name (from session creation response)
     */
    roomName: string;

    /**
     * Optional: API base URL (defaults to production)
     */
    apiBaseUrl?: string;

    /**
     * Optional: Firebase auth token for authenticated requests
     */
    authToken?: string;

    /**
     * Callback when the meeting ends
     */
    onMeetingEnd?: () => void;

    /**
     * Callback when an error occurs
     */
    onError?: (error: Error) => void;

    /**
     * Optional: Custom class names
     */
    className?: string;

    /**
     * Optional: Height of the component
     */
    height?: string | number;
}

interface Participant {
    id: string;
    displayName: string;
}

/**
 * GoGeoMeet - Exportable component for embedding in other applications.
 * 
 * This component provides a complete Jitsi meeting experience with Go Geo
 * branding and optional feedback functionality.
 * 
 * @example
 * ```tsx
 * // In LARA App or Ecossistema Go Geo 3
 * import { GoGeoMeet } from '@gogeo/meet';
 * 
 * <GoGeoMeet
 *   sessionId="session-abc123"
 *   roomName="GoGeo-MAT7A-xyz789"
 *   displayName="João Silva"
 *   role="student"
 *   onMeetingEnd={() => navigate('/dashboard')}
 * />
 * ```
 */
export function GoGeoMeet({
    sessionId,
    displayName,
    role,
    roomName,
    apiBaseUrl = '',
    authToken,
    onMeetingEnd,
    onError,
    className = '',
    height = '100%',
}: GoGeoMeetProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<any>(null);
    const [isReady, setIsReady] = useState(false);
    const [isConfused, setIsConfused] = useState(false);
    const [participants, setParticipants] = useState<Participant[]>([]);

    // Initialize Jitsi
    useEffect(() => {
        if (!containerRef.current || apiRef.current) return;

        const initJitsi = () => {
            if (!(window as any).JitsiMeetExternalAPI) {
                setTimeout(initJitsi, 100);
                return;
            }

            try {
                const api = new (window as any).JitsiMeetExternalAPI('meet.jit.si', {
                    roomName,
                    parentNode: containerRef.current,
                    width: '100%',
                    height: '100%',
                    userInfo: { displayName },
                    configOverwrite: {
                        prejoinPageEnabled: false,
                        startWithAudioMuted: true,
                        startWithVideoMuted: false,
                        disableDeepLinking: true,
                    },
                    interfaceConfigOverwrite: {
                        SHOW_JITSI_WATERMARK: false,
                        SHOW_WATERMARK_FOR_GUESTS: false,
                        SHOW_BRAND_WATERMARK: false,
                        SHOW_POWERED_BY: false,
                        MOBILE_APP_PROMO: false,
                        HIDE_INVITE_MORE_HEADER: true,
                    },
                });

                api.addListener('videoConferenceJoined', () => {
                    setIsReady(true);
                    recordAttendance('join');
                });

                api.addListener('participantJoined', (event: any) => {
                    setParticipants((prev) => [...prev, { id: event.id, displayName: event.displayName }]);
                });

                api.addListener('participantLeft', (event: any) => {
                    setParticipants((prev) => prev.filter((p) => p.id !== event.id));
                });

                api.addListener('readyToClose', () => {
                    recordAttendance('leave');
                    onMeetingEnd?.();
                });

                apiRef.current = api;
            } catch (err) {
                onError?.(err as Error);
            }
        };

        initJitsi();

        return () => {
            if (apiRef.current) {
                apiRef.current.dispose();
                apiRef.current = null;
            }
        };
    }, [roomName, displayName, onMeetingEnd, onError]);

    // Record attendance
    const recordAttendance = async (action: 'join' | 'leave') => {
        if (!apiBaseUrl) return;

        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

            await fetch(`${apiBaseUrl}/api/v1/meet/sessions/${sessionId}/${action}`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ alunoName: displayName }),
            });
        } catch (err) {
            console.error(`Error recording ${action}:`, err);
        }
    };

    // Toggle feedback
    const toggleFeedback = useCallback(async () => {
        const newState = !isConfused;
        setIsConfused(newState);

        if (!apiBaseUrl) return;

        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

            await fetch(`${apiBaseUrl}/api/v1/meet/sessions/${sessionId}/feedback`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ isConfused: newState, alunoName: displayName }),
            });
        } catch (err) {
            console.error('Error toggling feedback:', err);
        }
    }, [isConfused, sessionId, displayName, apiBaseUrl, authToken]);

    return (
        <div className={`gogeo-meet-container ${className}`} style={{ height, position: 'relative' }}>
            {/* Loading state */}
            {!isReady && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#142b64',
                    color: 'white',
                    zIndex: 10,
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: 48,
                            height: 48,
                            border: '3px solid rgba(255,255,255,0.3)',
                            borderTopColor: '#009FE3',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 16px',
                        }} />
                        <p>A preparar a sala...</p>
                    </div>
                </div>
            )}

            {/* Jitsi container */}
            <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

            {/* Feedback button for students */}
            {isReady && role === 'student' && (
                <button
                    onClick={toggleFeedback}
                    style={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        padding: '8px 16px',
                        borderRadius: 20,
                        border: 'none',
                        backgroundColor: isConfused ? '#009FE3' : 'white',
                        color: isConfused ? 'white' : '#333',
                        fontWeight: 500,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        zIndex: 20,
                    }}
                    aria-label={isConfused ? 'Remover dúvida' : 'Tenho dúvida'}
                >
                    <span style={{ fontSize: 18 }}>❓</span>
                    {isConfused ? 'Com dúvida' : 'Tenho dúvida'}
                </button>
            )}

            {/* Participant count for teachers */}
            {isReady && role === 'teacher' && (
                <div style={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    padding: '6px 12px',
                    borderRadius: 16,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    fontSize: 14,
                    zIndex: 20,
                }}>
                    {participants.length + 1} participante{participants.length !== 0 ? 's' : ''}
                </div>
            )}

            {/* Inline CSS for animation */}
            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}

export default GoGeoMeet;
