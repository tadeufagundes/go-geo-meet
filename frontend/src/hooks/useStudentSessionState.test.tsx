// @vitest-environment jsdom

import { act, cleanup, render } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useStudentSessionState } from './useStudentSessionState';

interface HarnessProps {
    sessionId: string;
    studentName: string;
    mainRoomName: string;
    onReady: (value: ReturnType<typeof useStudentSessionState>) => void;
}

function Harness({ sessionId, studentName, mainRoomName, onReady }: HarnessProps) {
    const value = useStudentSessionState({ sessionId, studentName, mainRoomName });

    useEffect(() => {
        onReady(value);
    }, [onReady, value]);

    return null;
}

describe('useStudentSessionState', () => {
    beforeEach(() => {
        window.sessionStorage.clear();
    });

    afterEach(() => {
        cleanup();
    });

    it('keeps the same student id but falls back to the main room across remounts until the teacher reassigns breakout', () => {
        let firstValue!: ReturnType<typeof useStudentSessionState>;

        const { unmount } = render(
            <Harness
                sessionId="session-1"
                studentName="Maria"
                mainRoomName="Sala Principal"
                onReady={(value) => {
                    firstValue = value;
                }}
            />
        );

        const firstStudentId = firstValue.studentId;

        act(() => {
            firstValue.setCurrentRoomName('Sala 2');
        });

        unmount();

        let secondValue!: ReturnType<typeof useStudentSessionState>;

        render(
            <Harness
                sessionId="session-1"
                studentName="Maria"
                mainRoomName="Sala Principal"
                onReady={(value) => {
                    secondValue = value;
                }}
            />
        );

        expect(secondValue.studentId).toBe(firstStudentId);
        expect(secondValue.currentRoomName).toBe('Sala Principal');
    });

    it('resets the persisted room back to the main room when requested', () => {
        let value!: ReturnType<typeof useStudentSessionState>;

        const { rerender } = render(
            <Harness
                sessionId="session-1"
                studentName="Maria"
                mainRoomName="Sala Principal"
                onReady={(nextValue) => {
                    value = nextValue;
                }}
            />
        );

        act(() => {
            value.setCurrentRoomName('Sala 3');
        });

        act(() => {
            value.resetRoomName();
        });

        rerender(
            <Harness
                sessionId="session-1"
                studentName="Maria"
                mainRoomName="Sala Principal"
                onReady={(nextValue) => {
                    value = nextValue;
                }}
            />
        );

        expect(value.currentRoomName).toBe('Sala Principal');
    });
});