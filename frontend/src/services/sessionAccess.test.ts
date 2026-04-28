import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildSessionAccessCandidates, resolveSessionAccessWithLookup } from './sessionAccess';

describe('sessionAccess', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('extracts the teacher room code and session id from a shared teacher URL', () => {
        expect(
            buildSessionAccessCandidates(
                'https://gogeomeet.web.app/teacher/room/GoGeo-MAT7A-abc123?turma=Matematica&sessionId=firestore-session-1'
            )
        ).toEqual({
            sessionIds: ['firestore-session-1', 'GoGeo-MAT7A-abc123'],
            roomNames: ['GoGeo-MAT7A-abc123'],
        });
    });

    it('prefers resolving by session id before falling back to room name', async () => {
        const getSessionById = vi.fn().mockResolvedValue({
            id: 'firestore-session-1',
            jitsiRoomName: 'GoGeo-MAT7A-abc123',
        });
        const getSessionByRoomName = vi.fn();

        const result = await resolveSessionAccessWithLookup(
            {
                getSessionById,
                getSessionByRoomName,
            },
            'firestore-session-1'
        );

        expect(result).toEqual({
            id: 'firestore-session-1',
            jitsiRoomName: 'GoGeo-MAT7A-abc123',
        });
        expect(getSessionById).toHaveBeenCalledWith('firestore-session-1');
        expect(getSessionByRoomName).not.toHaveBeenCalled();
    });

    it('falls back to room lookup when the raw code is a Jitsi room name', async () => {
        const getSessionById = vi.fn().mockResolvedValue(null);
        const getSessionByRoomName = vi.fn().mockResolvedValue({
            id: 'firestore-session-1',
            jitsiRoomName: 'GoGeo-MAT7A-abc123',
        });

        const result = await resolveSessionAccessWithLookup(
            {
                getSessionById,
                getSessionByRoomName,
            },
            'GoGeo-MAT7A-abc123'
        );

        expect(result).toEqual({
            id: 'firestore-session-1',
            jitsiRoomName: 'GoGeo-MAT7A-abc123',
        });
        expect(getSessionById).toHaveBeenCalledWith('GoGeo-MAT7A-abc123');
        expect(getSessionByRoomName).toHaveBeenCalledWith('GoGeo-MAT7A-abc123');
    });
});