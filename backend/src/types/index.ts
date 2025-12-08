// User roles
export type UserRole = 'student' | 'teacher' | 'admin';

// Session status
export type SessionStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';

// Class Session
export interface ClassSession {
    id: string;
    turmaId: string;
    turmaName: string;
    teacherId: string;
    teacherName: string;
    jitsiRoomName: string;
    jitsiRoomPassword: string;
    status: SessionStatus;
    scheduledAt: FirebaseFirestore.Timestamp;
    startedAt?: FirebaseFirestore.Timestamp;
    endedAt?: FirebaseFirestore.Timestamp;
    createdAt: FirebaseFirestore.Timestamp;
    updatedAt: FirebaseFirestore.Timestamp;
}

// Attendance Log
export interface AttendanceLog {
    id: string;
    sessionId: string;
    alunoId: string;
    alunoName: string;
    joinedAt: FirebaseFirestore.Timestamp;
    leftAt?: FirebaseFirestore.Timestamp;
}

// Silent Feedback
export interface SilentFeedback {
    id: string;
    sessionId: string;
    alunoId: string;
    alunoName: string;
    isConfused: boolean;
    updatedAt: FirebaseFirestore.Timestamp;
}

// API Request/Response DTOs
export interface CreateSessionDTO {
    turmaId: string;
    turmaName: string;
    scheduledAt?: string; // ISO date string
}

export interface CreateSessionResponseDTO {
    id: string;
    jitsiRoomName: string;
    jitsiRoomPassword: string;
    joinUrl: string;
    status: SessionStatus;
}

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

export interface JoinSessionDTO {
    alunoName: string;
}

export interface ToggleFeedbackDTO {
    isConfused: boolean;
}

export interface FeedbackListDTO {
    confusedCount: number;
    students: Array<{
        alunoId: string;
        alunoName: string;
        since: string;
    }>;
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
