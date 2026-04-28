import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase, getRoomChannel } from '@/supabase';

interface UseRoomSignalingOptions {
    sessionId: string;
    onMoveToRoom?: (roomName: string) => void;
    onBroadcastReceived?: (data: any) => void;
}

export function useRoomSignaling({ sessionId, onMoveToRoom, onBroadcastReceived }: UseRoomSignalingOptions) {
    const channelRef = useRef<ReturnType<typeof getRoomChannel> | null>(null);
    const onMoveToRoomRef = useRef(onMoveToRoom);
    const onBroadcastReceivedRef = useRef(onBroadcastReceived);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        onMoveToRoomRef.current = onMoveToRoom;
    }, [onMoveToRoom]);

    useEffect(() => {
        onBroadcastReceivedRef.current = onBroadcastReceived;
    }, [onBroadcastReceived]);

    useEffect(() => {
        if (!sessionId) {
            channelRef.current = null;
            setIsConnected(false);
            return;
        }

        const channel = getRoomChannel(sessionId);
        channelRef.current = channel;

        channel
            .on('broadcast', { event: 'move-to-room' }, ({ payload }) => {
                console.log('[Realtime] Move to room signal received:', payload);
                if (payload.roomName) {
                    onMoveToRoomRef.current?.(payload.roomName);
                }
            })
            .on('broadcast', { event: 'app-signal' }, ({ payload }) => {
                console.log('[Realtime] App signal received:', payload);
                onBroadcastReceivedRef.current?.(payload);
            })
            .subscribe(async (status, err) => {
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true);
                    console.log(`[Realtime] Subscribed to room channel: ${sessionId}`);
                }
                if (status === 'CHANNEL_ERROR') {
                    setIsConnected(false);
                    console.error('[Realtime] Channel error:', err);
                }
                if (status === 'TIMED_OUT') {
                    setIsConnected(false);
                    console.warn('[Realtime] Connection timed out. Retrying...');
                }
                if (status === 'CLOSED') {
                    setIsConnected(false);
                }
            });

        return () => {
            setIsConnected(false);
            if (channelRef.current === channel) {
                channelRef.current = null;
            }
            supabase.removeChannel(channel);
        };
    }, [sessionId]);

    const sendSignal = useCallback(async (event: string, payload: any) => {
        const channel = channelRef.current;

        if (!sessionId || !channel) {
            console.warn('[Realtime] Cannot send signal without an active room channel.');
            return;
        }

        await channel.send({
            type: 'broadcast',
            event,
            payload,
        });
    }, [sessionId]);

    const moveToRoom = useCallback((roomName: string) => {
        sendSignal('move-to-room', { roomName });
    }, [sendSignal]);

    return {
        isConnected,
        sendSignal,
        moveToRoom,
    };
}
