import { describe, expect, it } from 'vitest';

import {
    buildBreakoutRooms,
    distributeParticipantsAcrossBreakoutRooms,
    getNextBreakoutRoomName,
    removeBreakoutRoomAssignments,
    resolveParticipantRoomName,
} from './breakoutRoomManager';

describe('breakoutRoomManager', () => {
    it('builds the expected default breakout room names', () => {
        expect(buildBreakoutRooms(3)).toEqual(['Sala 1', 'Sala 2', 'Sala 3']);
    });

    it('creates the next numbered breakout room even when rooms were removed', () => {
        expect(getNextBreakoutRoomName(['Sala 1', 'Sala 3'])).toBe('Sala 4');
        expect(getNextBreakoutRoomName(['Grupo A'])).toBe('Sala 1');
    });

    it('removes all assignments from the deleted room only', () => {
        expect(removeBreakoutRoomAssignments({ a: 'Sala 1', b: 'Sala 2' }, 'Sala 1')).toEqual({ b: 'Sala 2' });
    });

    it('falls back to the persisted student assignment when live participant room is not available', () => {
        expect(resolveParticipantRoomName({
            participantId: 'participant-1',
            participantRooms: {},
            participantStudentIds: {
                'participant-1': 'student-1',
            },
            studentAssignments: {
                'student-1': 'Sala 2',
            },
            mainRoomName: 'Sala Geral',
        })).toBe('Sala 2');
    });

    it('prefers the live participant room when it is already known', () => {
        expect(resolveParticipantRoomName({
            participantId: 'participant-1',
            participantRooms: {
                'participant-1': 'Sala 1',
            },
            participantStudentIds: {
                'participant-1': 'student-1',
            },
            studentAssignments: {
                'student-1': 'Sala 2',
            },
            mainRoomName: 'Sala Geral',
        })).toBe('Sala 1');
    });

    it('distributes participants across breakout rooms deterministically', () => {
        expect(
            distributeParticipantsAcrossBreakoutRooms(
                [
                    { id: '2', displayName: 'Bruno' },
                    { id: '3', displayName: 'Caio' },
                    { id: '1', displayName: 'Ana' },
                ],
                ['Sala 1', 'Sala 2']
            )
        ).toEqual({
            '1': 'Sala 1',
            '2': 'Sala 2',
            '3': 'Sala 1',
        });
    });
});