// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useRoomSignaling } from './useRoomSignaling';

const { removeChannelMock, getRoomChannelMock, channelFactoryMock, supabaseConfigState } = vi.hoisted(() => ({
    removeChannelMock: vi.fn(),
    getRoomChannelMock: vi.fn(),
    channelFactoryMock: vi.fn(),
    supabaseConfigState: { current: true },
}));

vi.mock('@/supabase', () => ({
    get isSupabaseConfigured() {
        return supabaseConfigState.current;
    },
    supabase: {
        channel: channelFactoryMock,
        removeChannel: removeChannelMock,
    },
    getRoomChannel: getRoomChannelMock,
}));

type BroadcastHandler = (event: { payload: Record<string, unknown> }) => void;

function createMockChannel() {
    const handlers = new Map<string, BroadcastHandler>();

    const channel = {
        handlers,
        on: vi.fn((_: string, filter: { event: string }, callback: BroadcastHandler) => {
            handlers.set(filter.event, callback);
            return channel;
        }),
        subscribe: vi.fn((callback?: (status: string, error?: Error) => void) => {
            callback?.('SUBSCRIBED');
            return channel;
        }),
        send: vi.fn().mockResolvedValue(undefined),
    };

    return channel;
}

interface HarnessProps {
    sessionId: string;
    onMoveToRoom?: (roomName: string) => void;
    onBroadcastReceived?: (payload: Record<string, unknown>) => void;
    onReady: (api: ReturnType<typeof useRoomSignaling>) => void;
}

function Harness({ sessionId, onMoveToRoom, onBroadcastReceived, onReady }: HarnessProps) {
    const api = useRoomSignaling({ sessionId, onMoveToRoom, onBroadcastReceived });
    onReady(api);
    return null;
}

describe('useRoomSignaling', () => {
    beforeEach(() => {
        supabaseConfigState.current = true;
        removeChannelMock.mockReset();
        getRoomChannelMock.mockReset();
        channelFactoryMock.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it('reuses the subscribed room channel when sending signals', async () => {
        const channel = createMockChannel();
        getRoomChannelMock.mockReturnValue(channel);

        let api!: ReturnType<typeof useRoomSignaling>;

        render(
            <Harness
                sessionId="session-1"
                onReady={(value) => {
                    api = value;
                }}
            />
        );

        await act(async () => {
            await api.sendSignal('app-signal', { type: 'PING' });
        });

        expect(getRoomChannelMock).toHaveBeenCalledTimes(1);
        expect(channel.send).toHaveBeenCalledWith({
            type: 'broadcast',
            event: 'app-signal',
            payload: { type: 'PING' },
        });
    });

    it('routes ai-request signals through the dedicated ai-signals channel', async () => {
        const roomChannel = createMockChannel();
        const aiChannel = createMockChannel();
        getRoomChannelMock.mockReturnValue(roomChannel);
        channelFactoryMock.mockReturnValue(aiChannel);

        let api!: ReturnType<typeof useRoomSignaling>;

        render(
            <Harness
                sessionId="session-1"
                onReady={(value) => {
                    api = value;
                }}
            />
        );

        await act(async () => {
            await api.sendSignal('ai-request', { action: 'START' });
        });

        expect(channelFactoryMock).toHaveBeenCalledWith('ai-signals');
        expect(aiChannel.send).toHaveBeenCalledWith({
            type: 'broadcast',
            event: 'ai-request',
            payload: { action: 'START' },
        });
        expect(roomChannel.send).not.toHaveBeenCalled();
    });

    it('keeps the same subscription while using the latest callbacks', () => {
        const channel = createMockChannel();
        getRoomChannelMock.mockReturnValue(channel);

        const initialMoveHandler = vi.fn();
        const nextMoveHandler = vi.fn();
        const initialBroadcastHandler = vi.fn();
        const nextBroadcastHandler = vi.fn();

        const { rerender, unmount } = render(
            <Harness
                sessionId="session-1"
                onMoveToRoom={initialMoveHandler}
                onBroadcastReceived={initialBroadcastHandler}
                onReady={() => undefined}
            />
        );

        rerender(
            <Harness
                sessionId="session-1"
                onMoveToRoom={nextMoveHandler}
                onBroadcastReceived={nextBroadcastHandler}
                onReady={() => undefined}
            />
        );

        act(() => {
            channel.handlers.get('move-to-room')?.({ payload: { roomName: 'Sala 2' } });
            channel.handlers.get('app-signal')?.({ payload: { type: 'SYNC' } });
        });

        expect(getRoomChannelMock).toHaveBeenCalledTimes(1);
        expect(initialMoveHandler).not.toHaveBeenCalled();
        expect(initialBroadcastHandler).not.toHaveBeenCalled();
        expect(nextMoveHandler).toHaveBeenCalledWith('Sala 2');
        expect(nextBroadcastHandler).toHaveBeenCalledWith({ type: 'SYNC' });

        unmount();

        expect(removeChannelMock).toHaveBeenCalledWith(channel);
    });

    it('stays idle when Supabase realtime is not configured', async () => {
        supabaseConfigState.current = false;

        let api!: ReturnType<typeof useRoomSignaling>;
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        render(
            <Harness
                sessionId="session-1"
                onReady={(value) => {
                    api = value;
                }}
            />
        );

        await act(async () => {
            await api.sendSignal('app-signal', { type: 'PING' });
        });

        expect(api.isConnected).toBe(false);
        expect(getRoomChannelMock).not.toHaveBeenCalled();
        expect(removeChannelMock).not.toHaveBeenCalled();
        expect(warnSpy).not.toHaveBeenCalledWith('[Realtime] Cannot send signal without an active room channel.');

        warnSpy.mockRestore();
    });
});