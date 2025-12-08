// User roles
export type UserRole = 'student' | 'teacher' | 'admin';

// Session status
export type SessionStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';

// User
export interface User {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
}

// Class Session (from API)
export interface SessionDTO {
    id: string;
    turmaId: string;
    turmaName: string;
    teacherId: string;
    teacherName: string;
    jitsiRoomName: string;
    status: SessionStatus;
    scheduledAt: string;
    startedAt?: string;
    endedAt?: string;
}

// Create Session Response
export interface CreateSessionResponseDTO {
    id: string;
    jitsiRoomName: string;
    jitsiRoomPassword: string;
    joinUrl: string;
    status: SessionStatus;
}

// Attendance Log
export interface AttendanceLog {
    id: string;
    sessionId: string;
    alunoId: string;
    alunoName: string;
    joinedAt: string;
    leftAt?: string;
}

// Silent Feedback
export interface SilentFeedback {
    id: string;
    sessionId: string;
    alunoId: string;
    alunoName: string;
    isConfused: boolean;
    updatedAt: string;
}

// Feedback List Response
export interface FeedbackListDTO {
    confusedCount: number;
    students: Array<{
        alunoId: string;
        alunoName: string;
        since: string;
    }>;
}

// Jitsi participant
export interface Participant {
    id: string;
    displayName: string;
    isLocal?: boolean;
}

// Error response
export interface ErrorResponse {
    code: string;
    message: string;
    userMessage: string;
    details?: unknown;
    timestamp: string;
    requestId?: string;
}
