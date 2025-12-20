import { useRef } from 'react';
import { useJitsi } from '@/hooks/useJitsi';
import type { Participant } from '@/types';

interface JitsiMeetProps {
    roomName: string;
    displayName: string;
    password?: string;
    role: 'teacher' | 'student';
    onParticipantJoined?: (participant: Participant) => void;
    onParticipantLeft?: (participantId: string) => void;
    onMeetingEnd?: () => void;
    onReady?: () => void;
    className?: string;
}

export function JitsiMeet({
    roomName,
    displayName,
    password,
    role,
    onParticipantJoined,
    onParticipantLeft,
    onMeetingEnd,
    onReady,
    className = '',
}: JitsiMeetProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const { isReady, participants } = useJitsi(containerRef, {
        roomName,
        displayName,
        password,
        role,
        onParticipantJoined,
        onParticipantLeft,
        onMeetingEnd,
        onReady,
    });

    return (
        <div className={`relative ${className}`}>
            {/* Loading state */}
            {!isReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-navy-900 text-white z-10">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4" />
                        <p className="text-lg">A preparar a sala de aula...</p>
                        <p className="text-sm text-gray-400 mt-2">Sala: {roomName}</p>
                    </div>
                </div>
            )}

            {/* Jitsi container */}
            <div
                ref={containerRef}
                className="jitsi-container w-full h-full"
                style={{ minHeight: '500px' }}
            />

            {/* Participant count indicator */}
            {isReady && role === 'teacher' && (
                <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {participants.length + 1} participante{participants.length !== 0 ? 's' : ''}
                </div>
            )}
        </div>
    );
}
