import type { Participant } from '@/types';

const BREAKOUT_ROOM_PREFIX = 'Sala';

export function buildBreakoutRooms(roomCount: number) {
    return Array.from({ length: roomCount }, (_, index) => `${BREAKOUT_ROOM_PREFIX} ${index + 1}`);
}

export function getNextBreakoutRoomName(existingRooms: string[]) {
    const nextIndex = existingRooms.reduce((highestValue, roomName) => {
        const match = roomName.match(/^Sala\s+(\d+)$/i);

        if (!match) {
            return highestValue;
        }

        const roomIndex = Number.parseInt(match[1], 10);
        return Number.isFinite(roomIndex) ? Math.max(highestValue, roomIndex) : highestValue;
    }, 0);

    return `${BREAKOUT_ROOM_PREFIX} ${nextIndex + 1}`;
}

export function removeBreakoutRoomAssignments<T extends string>(
    assignments: Record<string, T>,
    roomName: T,
) {
    return Object.fromEntries(
        Object.entries(assignments).filter(([, assignedRoom]) => assignedRoom !== roomName)
    ) as Record<string, T>;
}

export function distributeParticipantsAcrossBreakoutRooms(
    participants: Participant[],
    breakoutRooms: string[],
) {
    if (breakoutRooms.length === 0) {
        return {} as Record<string, string>;
    }

    const orderedParticipants = [...participants].sort((leftParticipant, rightParticipant) => {
        const displayNameComparison = leftParticipant.displayName.localeCompare(rightParticipant.displayName, 'pt-BR', {
            sensitivity: 'base',
        });

        if (displayNameComparison !== 0) {
            return displayNameComparison;
        }

        return leftParticipant.id.localeCompare(rightParticipant.id);
    });

    return orderedParticipants.reduce<Record<string, string>>((assignments, participant, index) => {
        assignments[participant.id] = breakoutRooms[index % breakoutRooms.length];
        return assignments;
    }, {});
}