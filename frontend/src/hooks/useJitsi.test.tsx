// @vitest-environment jsdom

import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRef } from 'react';

import { useJitsi } from './useJitsi';

type EventHandler = (event: { id: string }) => void;

interface MockApi {
    handlers: Map<string, EventHandler>;
    addListener: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
    executeCommand: ReturnType<typeof vi.fn>;
}

function createMockApi(): MockApi {
    const handlers = new Map<string, EventHandler>();

    return {
        handlers,
        addListener: vi.fn((eventName: string, handler: EventHandler) => {
            handlers.set(eventName, handler);
        }),
        dispose: vi.fn(),
        executeCommand: vi.fn(),
    };
}

const apiFactory = vi.fn(() => createMockApi());

function Harness({ onReady }: { onReady?: (participantId: string) => void }) {
    const containerRef = useRef<HTMLDivElement>(null);

    useJitsi(containerRef, {
        roomName: 'room-1',
        displayName: 'Aluno',
        role: 'student',
        onReady,
    });

    return <div ref={containerRef} />;
}

describe('useJitsi', () => {
    beforeEach(() => {
        apiFactory.mockClear();
        window.JitsiMeetExternalAPI = apiFactory as unknown as typeof window.JitsiMeetExternalAPI;
    });

    afterEach(() => {
        cleanup();
        delete (window as Partial<Window>).JitsiMeetExternalAPI;
    });

    it('keeps the same conference instance while using the latest onReady callback', () => {
        const firstOnReady = vi.fn();
        const secondOnReady = vi.fn();

        const { rerender, unmount } = render(<Harness onReady={firstOnReady} />);

        expect(apiFactory).toHaveBeenCalledTimes(1);

        const api = apiFactory.mock.results[0]?.value as MockApi;

        rerender(<Harness onReady={secondOnReady} />);

        expect(apiFactory).toHaveBeenCalledTimes(1);
        expect(api.dispose).not.toHaveBeenCalled();

        act(() => {
            api.handlers.get('videoConferenceJoined')?.({ id: 'participant-1' });
        });

        expect(firstOnReady).not.toHaveBeenCalled();
        expect(secondOnReady).toHaveBeenCalledWith('participant-1');

        unmount();

        expect(api.dispose).toHaveBeenCalledTimes(1);
    });
});