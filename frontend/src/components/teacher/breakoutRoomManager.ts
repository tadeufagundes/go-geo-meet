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

interface ResolveParticipantStudentIdOptions {
    participantId: string;
    participantDisplayName?: string;
    participantStudentIds: Record<string, string>;
    studentNames: Record<string, string>;
}

function normalizeParticipantDisplayName(value: string) {
    return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
}

export function resolveParticipantStudentId({
    participantId,
    participantDisplayName,
    participantStudentIds,
    studentNames,
}: ResolveParticipantStudentIdOptions) {
    const persistedParticipantStudentId = participantStudentIds[participantId];

    if (persistedParticipantStudentId) {
        return persistedParticipantStudentId;
    }

    if (!participantDisplayName) {
        return undefined;
    }

    const normalizedDisplayName = normalizeParticipantDisplayName(participantDisplayName);

    if (!normalizedDisplayName) {
        return undefined;
    }

    const matchingStudentIds = Object.entries(studentNames)
        .filter(([, studentName]) => normalizeParticipantDisplayName(studentName) === normalizedDisplayName)
        .map(([studentId]) => studentId);

    return matchingStudentIds.length === 1 ? matchingStudentIds[0] : undefined;
}

interface ResolveParticipantRoomNameOptions {
    participantId: string;
    participantDisplayName?: string;
    participantRooms: Record<string, string>;
    participantStudentIds: Record<string, string>;
    studentAssignments: Record<string, string>;
    studentNames: Record<string, string>;
    mainRoomName: string;
}

export function resolveParticipantRoomName({
    participantId,
    participantDisplayName,
    participantRooms,
    participantStudentIds,
    studentAssignments,
    studentNames,
    mainRoomName,
}: ResolveParticipantRoomNameOptions) {
    const participantRoom = participantRooms[participantId];

    if (participantRoom) {
        return participantRoom;
    }

    const studentId = resolveParticipantStudentId({
        participantId,
        participantDisplayName,
        participantStudentIds,
        studentNames,
    });
    const assignedRoom = studentId ? studentAssignments[studentId] : undefined;

    return assignedRoom || mainRoomName;
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