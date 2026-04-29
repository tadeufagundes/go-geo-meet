export interface StudentPresencePayload {
    participantId: string;
    studentId: string;
    studentName: string;
    currentRoomName: string;
}

interface ResolveStudentPresenceSyncOptions {
    assignedRoomName?: string;
    breakoutRooms: string[];
    mainRoomName: string;
    currentRoomName: string;
}

interface SyncResolutionBase {
    displayRoomName: string;
}

export interface AssignmentSyncResolution extends SyncResolutionBase {
    action: 'assign';
    targetRoomName: string;
}

export interface ResetSyncResolution extends SyncResolutionBase {
    action: 'reset';
    targetRoomName: string;
}

export interface NoopSyncResolution extends SyncResolutionBase {
    action: 'noop';
}

export type StudentPresenceSyncResolution =
    | AssignmentSyncResolution
    | ResetSyncResolution
    | NoopSyncResolution;

function isValidRoomName(roomName: string, breakoutRooms: string[], mainRoomName: string) {
    return roomName === mainRoomName || breakoutRooms.includes(roomName);
}

export function resolveStudentPresenceSync({
    assignedRoomName,
    breakoutRooms,
    mainRoomName,
    currentRoomName,
}: ResolveStudentPresenceSyncOptions): StudentPresenceSyncResolution {
    if (assignedRoomName) {
        return assignedRoomName === currentRoomName
            ? { action: 'noop', displayRoomName: assignedRoomName }
            : {
                action: 'assign',
                targetRoomName: assignedRoomName,
                displayRoomName: assignedRoomName,
            };
    }

    if (currentRoomName !== mainRoomName && breakoutRooms.includes(currentRoomName)) {
        return {
            action: 'reset',
            targetRoomName: mainRoomName,
            displayRoomName: mainRoomName,
        };
    }

    if (isValidRoomName(currentRoomName, breakoutRooms, mainRoomName)) {
        return {
            action: 'noop',
            displayRoomName: currentRoomName,
        };
    }

    return {
        action: 'reset',
        targetRoomName: mainRoomName,
        displayRoomName: mainRoomName,
    };
}