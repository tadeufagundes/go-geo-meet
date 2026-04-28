import { useEffect, useCallback } from 'react';
import { supabase, getRoomChannel } from '@/supabase';

interface UseRoomSignalingOptions {
    sessionId: string;
    onMoveToRoom?: (roomName: string) => void;
    onBroadcastReceived?: (data: any) => void;
}

export function useRoomSignaling({ sessionId, onMoveToRoom, onBroadcastReceived }: UseRoomSignalingOptions) {
    useEffect(() => {
        if (!sessionId) return;

        const channel = getRoomChannel(sessionId);

        channel
            .on('broadcast', { event: 'move-to-room' }, ({ payload }) => {
                console.log('[Realtime] Move to room signal received:', payload);
                if (payload.roomName) {
                    onMoveToRoom?.(payload.roomName);
                }
            })
            .on('broadcast', { event: 'app-signal' }, ({ payload }) => {
                console.log('[Realtime] App signal received:', payload);
                onBroadcastReceived?.(payload);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`[Realtime] Subscribed to room channel: ${sessionId}`);
                }
            });

        return () => {
            channel.unsubscribe();
        };
    }, [sessionId, onMoveToRoom, onBroadcastReceived]);

    const sendSignal = useCallback(async (event: string, payload: any) => {
        const channel = getRoomChannel(sessionId);
        await channel.send({
            type: 'broadcast',
            event: event,
            payload: payload,
        });
    }, [sessionId]);

    const moveToRoom = useCallback((roomName: string) => {
        sendSignal('move-to-room', { roomName });
    }, [sendSignal]);

    return {
        sendSignal,
        moveToRoom,
    };
}
