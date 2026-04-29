// @vitest-environment jsdom

import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TeacherPanel } from './TeacherPanel';

vi.mock('@/hooks/useFeedback', () => ({
    useTeacherFeedback: () => ({
        confusedCount: 0,
    }),
}));

vi.mock('@/hooks/useRoomSignaling', () => ({
    useRoomSignaling: () => ({
        isConnected: false,
        moveToRoom: vi.fn(),
        sendSignal: vi.fn(),
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
});
