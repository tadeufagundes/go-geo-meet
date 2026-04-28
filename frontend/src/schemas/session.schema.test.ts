import { describe, expect, it } from 'vitest';

import {
    safeValidateSession,
    validateCreateSessionInput,
} from './session.schema';

describe('session schema', () => {
    it('accepts a valid create session payload', () => {
        expect(
            validateCreateSessionInput({
                turmaId: 'turma-7a',
                turmaName: '7A Ingles',
            })
        ).toEqual({
            turmaId: 'turma-7a',
            turmaName: '7A Ingles',
        });
    });

    it('rejects an invalid session payload with safe validation', () => {
        const result = safeValidateSession({
            id: 'session-1',
            turmaId: '',
            turmaName: '7A Ingles',
            teacherId: 'teacher-1',
            teacherName: 'Professor',
            jitsiRoomName: 'GoGeo-7A-123',
            status: 'live',
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(['turmaId']);
    });
});