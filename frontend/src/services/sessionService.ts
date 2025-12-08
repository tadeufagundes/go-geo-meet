import { get, post, patch } from './api';
import type {
    CreateSessionResponseDTO,
    SessionDTO
} from '../types';

interface CreateSessionParams {
    turmaId: string;
    turmaName: string;
    scheduledAt?: string;
}

interface ListSessionsResponse {
    sessions: SessionDTO[];
}

interface StartSessionResponse {
    success: boolean;
    message: string;
    jitsiRoomName: string;
    joinUrl: string;
}

interface EndSessionResponse {
    success: boolean;
    message: string;
}

/**
 * Create a new class session.
 */
export async function createSession(params: CreateSessionParams): Promise<CreateSessionResponseDTO> {
    return post<CreateSessionResponseDTO>('/sessions', params);
}

/**
 * List sessions for the authenticated teacher.
 */
export async function listSessions(status?: string): Promise<SessionDTO[]> {
    const query = status ? `?status=${status}` : '';
    const response = await get<ListSessionsResponse>(`/sessions${query}`);
    return response.sessions;
}

/**
 * Get session details by ID.
 */
export async function getSession(sessionId: string): Promise<SessionDTO> {
    return get<SessionDTO>(`/sessions/${sessionId}`, false);
}

/**
 * Start a session (set status to 'live').
 */
export async function startSession(sessionId: string): Promise<StartSessionResponse> {
    return patch<StartSessionResponse>(`/sessions/${sessionId}/start`);
}

/**
 * End a session (set status to 'completed').
 */
export async function endSession(sessionId: string): Promise<EndSessionResponse> {
    return patch<EndSessionResponse>(`/sessions/${sessionId}/end`);
}
