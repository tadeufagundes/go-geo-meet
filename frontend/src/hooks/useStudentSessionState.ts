import { useCallback, useEffect, useMemo, useState } from 'react';

interface UseStudentSessionStateOptions {
    sessionId: string;
    studentName: string;
    mainRoomName: string;
}

const STORAGE_PREFIX = 'gogeo:meet:student-session';

function buildStorageKey(sessionId: string, studentName: string, suffix: string) {
    const normalizedStudentName = encodeURIComponent(studentName.trim().toLowerCase() || 'aluno');
    return `${STORAGE_PREFIX}:${sessionId}:${normalizedStudentName}:${suffix}`;
}

function readSessionStorageValue(key: string): string | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        return window.sessionStorage.getItem(key);
    } catch (error) {
        console.warn('[StudentSession] Unable to read from sessionStorage.', error);
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
        console.warn('[StudentSession] Unable to write to sessionStorage.', error);
    }
}

function createStudentSessionId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `student-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function getOrCreatePersistedStudentId(storageKey: string) {
    const persistedStudentId = readSessionStorageValue(storageKey);

    if (persistedStudentId) {
        return persistedStudentId;
    }

    const nextStudentId = createStudentSessionId();
    writeSessionStorageValue(storageKey, nextStudentId);
    return nextStudentId;
}

function getPersistedRoomName(storageKey: string, mainRoomName: string) {
    return readSessionStorageValue(storageKey) || mainRoomName;
}

export function useStudentSessionState({ sessionId, studentName, mainRoomName }: UseStudentSessionStateOptions) {
    const storageKeys = useMemo(() => ({
        studentId: buildStorageKey(sessionId, studentName, 'student-id'),
        roomName: buildStorageKey(sessionId, studentName, 'room-name'),
    }), [sessionId, studentName]);

    const [studentId, setStudentId] = useState(() => getOrCreatePersistedStudentId(storageKeys.studentId));
    const [currentRoomName, setCurrentRoomName] = useState(() => getPersistedRoomName(storageKeys.roomName, mainRoomName));

    useEffect(() => {
        setStudentId(getOrCreatePersistedStudentId(storageKeys.studentId));
    }, [storageKeys.studentId]);

    useEffect(() => {
        setCurrentRoomName(getPersistedRoomName(storageKeys.roomName, mainRoomName));
    }, [storageKeys.roomName, mainRoomName]);

    useEffect(() => {
        if (!currentRoomName) {
            return;
        }

        writeSessionStorageValue(storageKeys.roomName, currentRoomName);
    }, [currentRoomName, storageKeys.roomName]);

    const resetRoomName = useCallback(() => {
        setCurrentRoomName(mainRoomName);
    }, [mainRoomName]);

    return {
        studentId,
        currentRoomName,
        setCurrentRoomName,
        resetRoomName,
    };
}