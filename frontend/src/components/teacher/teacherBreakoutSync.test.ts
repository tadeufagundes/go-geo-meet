import { describe, expect, it } from 'vitest';

import { resolveStudentPresenceSync } from './teacherBreakoutSync';

describe('resolveStudentPresenceSync', () => {
    it('reassigns a reconnecting student to the teacher-assigned breakout room', () => {
        expect(resolveStudentPresenceSync({
            assignedRoomName: 'Sala 2',
            breakoutRooms: ['Sala 1', 'Sala 2'],
            mainRoomName: 'Sala Geral',
            currentRoomName: 'Sala 1',
        })).toEqual({
            action: 'assign',
            targetRoomName: 'Sala 2',
            displayRoomName: 'Sala 2',
        });
    });

    it('resets a stale room back to the main room when the breakout no longer exists', () => {
        expect(resolveStudentPresenceSync({
            breakoutRooms: ['Sala 1'],
            mainRoomName: 'Sala Geral',
            currentRoomName: 'Sala 3',
        })).toEqual({
            action: 'reset',
            targetRoomName: 'Sala Geral',
            displayRoomName: 'Sala Geral',
        });
    });

    it('keeps the current room when the student is already in the main room and no reassignment exists', () => {
        expect(resolveStudentPresenceSync({
            breakoutRooms: ['Sala 1', 'Sala 2'],
            mainRoomName: 'Sala Geral',
            currentRoomName: 'Sala Geral',
        })).toEqual({
            action: 'noop',
            displayRoomName: 'Sala Geral',
        });
    });

    it('resets a reconnecting student to the main room when no teacher assignment exists anymore', () => {
        expect(resolveStudentPresenceSync({
            breakoutRooms: ['Sala 1', 'Sala 2'],
            mainRoomName: 'Sala Geral',
            currentRoomName: 'Sala 1',
        })).toEqual({
            action: 'reset',
            targetRoomName: 'Sala Geral',
            displayRoomName: 'Sala Geral',
        });
    });
});