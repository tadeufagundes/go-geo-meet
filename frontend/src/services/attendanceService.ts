import { post } from './api';

interface JoinSessionResponse {
    success: boolean;
    attendanceId: string;
    message: string;
    jitsiRoomName: string;
}

interface LeaveSessionResponse {
    success: boolean;
    message: string;
}

/**
 * Record student joining a session.
 */
export async function joinSession(
    sessionId: string,
    alunoName: string
): Promise<JoinSessionResponse> {
    return post<JoinSessionResponse>(
        `/sessions/${sessionId}/join`,
        { alunoName },
        false // Optional auth for anonymous join
    );
}

/**
 * Record student leaving a session.
 */
export async function leaveSession(
    sessionId: string,
    attendanceId?: string
): Promise<LeaveSessionResponse> {
    return post<LeaveSessionResponse>(
        `/sessions/${sessionId}/leave`,
        { attendanceId },
        false
    );
}
