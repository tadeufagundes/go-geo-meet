// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TeacherPanel } from './TeacherPanel';

const { moveToRoomMock, sendSignalMock } = vi.hoisted(() => ({
    moveToRoomMock: vi.fn(),
    sendSignalMock: vi.fn(),
}));

vi.mock('@/hooks/useFeedback', () => ({
    useTeacherFeedback: () => ({
        confusedCount: 0,
    }),
}));

vi.mock('@/hooks/useRoomSignaling', () => ({
    useRoomSignaling: () => ({
        isConnected: false,
        moveToRoom: moveToRoomMock,
        sendSignal: sendSignalMock,
    }),
}));

const STORAGE_PREFIX = 'gogeo:meet:teacher-breakout';

function buildStorageKey(sessionId: string, suffix: string) {
    return `${STORAGE_PREFIX}:${sessionId}:${suffix}`;
}

describe('TeacherPanel', () => {
    beforeEach(() => {
        window.sessionStorage.clear();
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('does not clear persisted participant mappings while the participant list is still empty on hydration', async () => {
        const sessionId = 'session-1';
        const persistedParticipantStudentIds = {
            participantA: 'studentA',
        };

        window.sessionStorage.setItem(buildStorageKey(sessionId, 'rooms'), JSON.stringify(['Sala 1', 'Sala 2']));
        window.sessionStorage.setItem(buildStorageKey(sessionId, 'student-assignments'), JSON.stringify({
            studentA: 'Sala 2',
        }));
        window.sessionStorage.setItem(
            buildStorageKey(sessionId, 'participant-student-ids'),
            JSON.stringify(persistedParticipantStudentIds)
        );

        render(
            <TeacherPanel
                sessionId={sessionId}
                roomName="Sala Geral"
                participants={[]}
            />
        );

        await waitFor(() => {
            expect(window.sessionStorage.getItem(buildStorageKey(sessionId, 'participant-student-ids'))).toBe(
                JSON.stringify(persistedParticipantStudentIds)
            );
        });
    });

    it('resolves the participant student id by persisted display name before a fresh presence sync arrives', () => {
        const sessionId = 'session-1';

        window.sessionStorage.setItem(buildStorageKey(sessionId, 'rooms'), JSON.stringify(['Sala 2']));
        window.sessionStorage.setItem(buildStorageKey(sessionId, 'student-assignments'), JSON.stringify({
            studentA: 'Sala 2',
        }));
        window.sessionStorage.setItem(buildStorageKey(sessionId, 'student-names'), JSON.stringify({
            studentA: 'Ana Silva',
        }));

        render(
            <TeacherPanel
                sessionId={sessionId}
                roomName="Sala Geral"
                participants={[
                    {
                        id: 'participant-live',
                        displayName: 'Ana Silva',
                    },
                ]}
            />
        );

        fireEvent.click(screen.getByLabelText('Remover Sala 2'));

        expect(sendSignalMock).toHaveBeenCalledWith('app-signal', {
            type: 'BREAKOUT_RESET',
            participantId: 'participant-live',
            studentId: 'studentA',
            roomName: 'Sala Geral',
        });
    });
});
