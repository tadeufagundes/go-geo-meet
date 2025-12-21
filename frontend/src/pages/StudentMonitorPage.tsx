import { useRef, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useJitsi } from '@/hooks/useJitsi';

/**
 * StudentMonitorPage - A minimal pop-out window for teachers to monitor students
 * 
 * This page is designed to be opened in a small floating window that 
 * overlays the teacher's ActiveInspire or other teaching software.
 * Shows only the student video thumbnails with filmstrip mode.
 */
export function StudentMonitorPage() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const [searchParams] = useSearchParams();
    const containerRef = useRef<HTMLDivElement>(null);

    // Get room name directly from URL query parameter (passed by TeacherPanel)
    const roomName = searchParams.get('room') || '';
    const displayName = searchParams.get('name') || 'Professor (Monitor)';

    const { isReady, participants } = useJitsi(containerRef, {
        roomName: roomName,
        displayName: `${displayName} (Monitor)`,
        role: 'teacher',
    });

    // Set window title
    useEffect(() => {
        document.title = `👥 Alunos (${participants.length})`;
    }, [participants.length]);

    if (!roomName) {
        return (
            <div className="h-screen w-screen bg-navy-900 flex items-center justify-center">
                <div className="text-center text-white">
                    <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm">Conectando ao monitor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-navy-900 overflow-hidden">
            {/* Header with participant count */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-navy-900/90 backdrop-blur-sm px-3 py-2 flex items-center justify-between border-b border-white/10">
                <span className="text-white text-sm font-medium">
                    👥 Alunos: {participants.length}
                </span>
                <button
                    onClick={() => window.close()}
                    className="text-white/60 hover:text-white text-xs"
                >
                    ✕ Fechar
                </button>
            </div>

            {/* Jitsi container - filmstrip only mode */}
            <div 
                ref={containerRef} 
                className="h-full w-full pt-10"
                style={{ minHeight: '100%' }}
            />

            {/* Loading overlay */}
            {!isReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-navy-900 z-20">
                    <div className="text-center text-white">
                        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-sm">Carregando alunos...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
