export interface SessionAccessRecord {
    id: string;
    jitsiRoomName: string;
}

export interface SessionAccessLookup<T extends SessionAccessRecord> {
    getSessionById: (sessionId: string) => Promise<T | null>;
    getSessionByRoomName: (roomName: string) => Promise<T | null>;
}

export interface SessionAccessCandidates {
    sessionIds: string[];
    roomNames: string[];
}

function pushUnique(target: string[], value?: string | null) {
    const normalizedValue = value?.trim();

    if (!normalizedValue || target.includes(normalizedValue)) {
        return;
    }

    target.push(normalizedValue);
}

export function buildSessionAccessCandidates(sessionEntry: string, sessionIdHint?: string): SessionAccessCandidates {
    const sessionIds: string[] = [];
    const roomNames: string[] = [];
    const trimmedEntry = sessionEntry.trim();
    let parsedAsUrl = false;

    pushUnique(sessionIds, sessionIdHint);

    if (!trimmedEntry) {
        return { sessionIds, roomNames };
    }

    try {
        const parsedUrl = new URL(trimmedEntry);
        parsedAsUrl = true;
        const pathSegments = parsedUrl.pathname
            .split('/')
            .filter(Boolean)
            .map((segment) => decodeURIComponent(segment));

        const pathToken = pathSegments[pathSegments.length - 1];

        pushUnique(sessionIds, parsedUrl.searchParams.get('sessionId'));
        pushUnique(sessionIds, pathToken);
        pushUnique(roomNames, pathToken);
    } catch {
        // Input is not a full URL. The raw token may still be a session id or room name.
    }

    if (!parsedAsUrl) {
        pushUnique(sessionIds, trimmedEntry);
        pushUnique(roomNames, trimmedEntry);
    }

    return { sessionIds, roomNames };
}

export async function resolveSessionAccessWithLookup<T extends SessionAccessRecord>(
    lookup: SessionAccessLookup<T>,
    sessionEntry: string,
    sessionIdHint?: string,
): Promise<T | null> {
    const { sessionIds, roomNames } = buildSessionAccessCandidates(sessionEntry, sessionIdHint);

    for (const sessionId of sessionIds) {
        const session = await lookup.getSessionById(sessionId);

        if (session) {
            return session;
        }
    }

    for (const roomName of roomNames) {
        const session = await lookup.getSessionByRoomName(roomName);

        if (session) {
            return session;
        }
    }

    return null;
}