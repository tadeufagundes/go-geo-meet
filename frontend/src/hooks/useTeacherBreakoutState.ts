import { useCallback, useEffect, useMemo, useState, type SetStateAction } from 'react';

interface UseTeacherBreakoutStateOptions {
    sessionId: string;
    mainRoomName: string;
}

const STORAGE_PREFIX = 'gogeo:meet:teacher-breakout';

function buildStorageKey(sessionId: string, suffix: string) {
    return `${STORAGE_PREFIX}:${sessionId}:${suffix}`;
}

function readSessionStorageValue(key: string) {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        return window.sessionStorage.getItem(key);
    } catch (error) {
        console.warn('[TeacherBreakoutState] Unable to read from sessionStorage.', error);
        return null;
    }
}

function writeSessionStorageValue(key: string, value: string) {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.sessionStorage.setItem(key, value);
    } catch (error) {
        console.warn('[TeacherBreakoutState] Unable to write to sessionStorage.', error);
    }
}

function parseJson<T>(value: string | null, fallbackValue: T) {
    if (!value) {
        return fallbackValue;
    }

    try {
        return JSON.parse(value) as T;
    } catch (error) {
        console.warn('[TeacherBreakoutState] Unable to parse persisted state.', error);
        return fallbackValue;
    }
}

function sanitizeBreakoutRooms(value: unknown, mainRoomName: string) {
    if (!Array.isArray(value)) {
        return [];
    }

    const normalizedRooms = value
        .filter((roomName): roomName is string => typeof roomName === 'string')
        .map((roomName) => roomName.trim())
        .filter((roomName) => roomName.length > 0 && roomName !== mainRoomName);

    return Array.from(new Set(normalizedRooms));
}

function sanitizeStudentAssignments(value: unknown, breakoutRooms: string[]) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {} as Record<string, string>;
    }

    return Object.fromEntries(
        Object.entries(value).filter(([studentId, roomName]) => (
            typeof studentId === 'string'
            && studentId.length > 0
            && typeof roomName === 'string'
            && breakoutRooms.includes(roomName)
        ))
    );
}

function sanitizeParticipantStudentIds(value: unknown) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {} as Record<string, string>;
    }

    return Object.fromEntries(
        Object.entries(value).filter(([participantId, studentId]) => (
            typeof participantId === 'string'
            && participantId.length > 0
            && typeof studentId === 'string'
            && studentId.length > 0
        ))
    );
}

function areStringArraysEqual(left: string[], right: string[]) {
    return left.length === right.length && left.every((value, index) => value === right[index]);
}

function areAssignmentMapsEqual(left: Record<string, string>, right: Record<string, string>) {
    const leftEntries = Object.entries(left);
    const rightEntries = Object.entries(right);

    return leftEntries.length === rightEntries.length
        && leftEntries.every(([studentId, roomName]) => right[studentId] === roomName);
}

function resolveStateAction<T>(value: SetStateAction<T>, previousValue: T) {
    return typeof value === 'function'
        ? (value as (previousState: T) => T)(previousValue)
        : value;
}

function getPersistedBreakoutRooms(storageKey: string, mainRoomName: string) {
    return sanitizeBreakoutRooms(parseJson(readSessionStorageValue(storageKey), []), mainRoomName);
}

function getPersistedStudentAssignments(storageKey: string, breakoutRooms: string[]) {
    return sanitizeStudentAssignments(parseJson(readSessionStorageValue(storageKey), {}), breakoutRooms);
}

function getPersistedParticipantStudentIds(storageKey: string) {
    return sanitizeParticipantStudentIds(parseJson(readSessionStorageValue(storageKey), {}));
}

export function useTeacherBreakoutState({ sessionId, mainRoomName }: UseTeacherBreakoutStateOptions) {
    const storageScope = sessionId.trim() || mainRoomName.trim().toLowerCase() || 'default';
    const storageKeys = useMemo(() => ({
        breakoutRooms: buildStorageKey(storageScope, 'rooms'),
        studentAssignments: buildStorageKey(storageScope, 'student-assignments'),
        participantStudentIds: buildStorageKey(storageScope, 'participant-student-ids'),
    }), [storageScope]);

    const [breakoutRoomsState, setBreakoutRoomsState] = useState(() => getPersistedBreakoutRooms(storageKeys.breakoutRooms, mainRoomName));
    const [studentAssignmentsState, setStudentAssignmentsState] = useState(() => getPersistedStudentAssignments(storageKeys.studentAssignments, breakoutRoomsState));
    const [participantStudentIdsState, setParticipantStudentIdsState] = useState(() => getPersistedParticipantStudentIds(storageKeys.participantStudentIds));

    useEffect(() => {
        const nextBreakoutRooms = getPersistedBreakoutRooms(storageKeys.breakoutRooms, mainRoomName);
        const nextParticipantStudentIds = getPersistedParticipantStudentIds(storageKeys.participantStudentIds);

        setBreakoutRoomsState((previousValue) => areStringArraysEqual(previousValue, nextBreakoutRooms) ? previousValue : nextBreakoutRooms);
        setStudentAssignmentsState((previousValue) => {
            const nextStudentAssignments = getPersistedStudentAssignments(storageKeys.studentAssignments, nextBreakoutRooms);
            return areAssignmentMapsEqual(previousValue, nextStudentAssignments) ? previousValue : nextStudentAssignments;
        });
        setParticipantStudentIdsState((previousValue) => {
            return areAssignmentMapsEqual(previousValue, nextParticipantStudentIds) ? previousValue : nextParticipantStudentIds;
        });
    }, [mainRoomName, storageKeys.breakoutRooms, storageKeys.participantStudentIds, storageKeys.studentAssignments]);

    useEffect(() => {
        setStudentAssignmentsState((previousValue) => {
            const nextStudentAssignments = sanitizeStudentAssignments(previousValue, breakoutRoomsState);
            return areAssignmentMapsEqual(previousValue, nextStudentAssignments) ? previousValue : nextStudentAssignments;
        });
    }, [breakoutRoomsState]);

    useEffect(() => {
        writeSessionStorageValue(storageKeys.breakoutRooms, JSON.stringify(breakoutRoomsState));
    }, [breakoutRoomsState, storageKeys.breakoutRooms]);

    useEffect(() => {
        writeSessionStorageValue(storageKeys.studentAssignments, JSON.stringify(studentAssignmentsState));
    }, [studentAssignmentsState, storageKeys.studentAssignments]);

    useEffect(() => {
        writeSessionStorageValue(storageKeys.participantStudentIds, JSON.stringify(participantStudentIdsState));
    }, [participantStudentIdsState, storageKeys.participantStudentIds]);

    const setBreakoutRooms = useCallback((value: SetStateAction<string[]>) => {
        setBreakoutRoomsState((previousValue) => {
            const nextValue = sanitizeBreakoutRooms(resolveStateAction(value, previousValue), mainRoomName);
            return areStringArraysEqual(previousValue, nextValue) ? previousValue : nextValue;
        });
    }, [mainRoomName]);

    const setStudentAssignments = useCallback((value: SetStateAction<Record<string, string>>) => {
        setStudentAssignmentsState((previousValue) => {
            const nextValue = sanitizeStudentAssignments(resolveStateAction(value, previousValue), breakoutRoomsState);
            return areAssignmentMapsEqual(previousValue, nextValue) ? previousValue : nextValue;
        });
    }, [breakoutRoomsState]);

    const setParticipantStudentIds = useCallback((value: SetStateAction<Record<string, string>>) => {
        setParticipantStudentIdsState((previousValue) => {
            const nextValue = sanitizeParticipantStudentIds(resolveStateAction(value, previousValue));
            return areAssignmentMapsEqual(previousValue, nextValue) ? previousValue : nextValue;
        });
    }, []);

    return {
        breakoutRooms: breakoutRoomsState,
        setBreakoutRooms,
        studentAssignments: studentAssignmentsState,
        setStudentAssignments,
        participantStudentIds: participantStudentIdsState,
        setParticipantStudentIds,
    };
}
