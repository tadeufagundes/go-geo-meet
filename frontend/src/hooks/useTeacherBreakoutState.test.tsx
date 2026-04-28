// @vitest-environment jsdom

import { act, cleanup, render } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useTeacherBreakoutState } from './useTeacherBreakoutState';

interface HarnessProps {
    sessionId: string;
    mainRoomName: string;
    onReady: (value: ReturnType<typeof useTeacherBreakoutState>) => void;
}

function Harness({ sessionId, mainRoomName, onReady }: HarnessProps) {
    const value = useTeacherBreakoutState({ sessionId, mainRoomName });

    useEffect(() => {
        onReady(value);
    }, [onReady, value]);

    return null;
}

describe('useTeacherBreakoutState', () => {
    beforeEach(() => {
        window.sessionStorage.clear();
    });

    afterEach(() => {
        cleanup();
    });

    it('persists breakout rooms and student assignments across remounts in the same tab', () => {
        let firstValue!: ReturnType<typeof useTeacherBreakoutState>;

        const { unmount } = render(
            <Harness
                sessionId="session-1"
                mainRoomName="Sala Geral"
                onReady={(value) => {
                    firstValue = value;
                }}
            />
        );

        act(() => {
            firstValue.setBreakoutRooms(['Sala 1', 'Sala 2']);
        });

        act(() => {
            firstValue.setStudentAssignments({
                studentA: 'Sala 2',
            });
        });

        unmount();

        let secondValue!: ReturnType<typeof useTeacherBreakoutState>;

        render(
            <Harness
                sessionId="session-1"
                mainRoomName="Sala Geral"
                onReady={(value) => {
                    secondValue = value;
                }}
            />
        );

        expect(secondValue.breakoutRooms).toEqual(['Sala 1', 'Sala 2']);
        expect(secondValue.studentAssignments).toEqual({
            studentA: 'Sala 2',
        });
    });

    it('drops assignments that point to rooms removed from the persisted topology', () => {
        let value!: ReturnType<typeof useTeacherBreakoutState>;

        render(
            <Harness
                sessionId="session-1"
                mainRoomName="Sala Geral"
                onReady={(nextValue) => {
                    value = nextValue;
                }}
            />
        );

        act(() => {
            value.setBreakoutRooms(['Sala 1', 'Sala 2']);
        });

        act(() => {
            value.setStudentAssignments({
                studentA: 'Sala 1',
                studentB: 'Sala 2',
            });
        });

        act(() => {
            value.setBreakoutRooms(['Sala 1']);
        });

        expect(value.breakoutRooms).toEqual(['Sala 1']);
        expect(value.studentAssignments).toEqual({
            studentA: 'Sala 1',
        });
    });
});