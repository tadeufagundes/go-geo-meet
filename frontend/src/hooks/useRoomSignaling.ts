import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase, getRoomChannel, isSupabaseConfigured } from '@/supabase';

interface UseRoomSignalingOptions {
    sessionId: string;
    onMoveToRoom?: (roomName: string) => void;
    onBroadcastReceived?: (data: any) => void;
}

export function useRoomSignaling({ sessionId, onMoveToRoom, onBroadcastReceived }: UseRoomSignalingOptions) {
    const channelRef = useRef<ReturnType<typeof getRoomChannel> | null>(null);
    const aiChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const aiChannelSubscriptionRef = useRef<Promise<ReturnType<typeof supabase.channel>> | null>(null);
    const onMoveToRoomRef = useRef(onMoveToRoom);
    const onBroadcastReceivedRef = useRef(onBroadcastReceived);
    const [isConnected, setIsConnected] = useState(false);

    const ensureAiSignalChannel = useCallback(async () => {
        if (aiChannelRef.current) {
            return aiChannelRef.current;
        }

        if (aiChannelSubscriptionRef.current) {
            return aiChannelSubscriptionRef.current;
        }

        const aiChannel = supabase.channel('ai-signals');
        aiChannelRef.current = aiChannel;

        aiChannelSubscriptionRef.current = new Promise((resolve, reject) => {
            aiChannel.subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    aiChannelSubscriptionRef.current = null;
                    resolve(aiChannel);
                    return;
                }

                if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    if (aiChannelRef.current === aiChannel) {
                        aiChannelRef.current = null;
                    }
                    aiChannelSubscriptionRef.current = null;
                    reject(err ?? new Error('AI signal channel unavailable.'));
                    return;
                }

                if (status === 'CLOSED' && aiChannelRef.current === aiChannel) {
                    aiChannelRef.current = null;
                    aiChannelSubscriptionRef.current = null;
                }
            });
        });

        return aiChannelSubscriptionRef.current;
    }, []);

    useEffect(() => {
        onMoveToRoomRef.current = onMoveToRoom;
    }, [onMoveToRoom]);

    useEffect(() => {
        onBroadcastReceivedRef.current = onBroadcastReceived;
    }, [onBroadcastReceived]);

    useEffect(() => {
        if (!sessionId || !isSupabaseConfigured) {
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

            if (aiChannelRef.current) {
                supabase.removeChannel(aiChannelRef.current);
                aiChannelRef.current = null;
                aiChannelSubscriptionRef.current = null;
            }
        };
    }, [sessionId]);

    const sendSignal = useCallback(async (event: string, payload: any) => {
        if (!sessionId || !isSupabaseConfigured) {
            return;
        }

        let channel = channelRef.current;

        if (event === 'ai-request') {
            try {
                channel = await ensureAiSignalChannel();
            } catch (error) {
                console.error('[Realtime] Cannot connect to AI signal channel:', error);
                return;
            }
        }

        if (!channel) {
            console.warn('[Realtime] Cannot send signal without an active room channel.');
            return;
        }

        await channel.send({
            type: 'broadcast',
            event,
            payload,
        });
    }, [ensureAiSignalChannel, sessionId]);

    const moveToRoom = useCallback((roomName: string) => {
        sendSignal('move-to-room', { roomName });
    }, [sendSignal]);

    return {
        isConnected,
        sendSignal,
        moveToRoom,
    };
}
