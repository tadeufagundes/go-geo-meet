import { get, post } from './api';
import type { FeedbackListDTO } from '../types';

interface ToggleFeedbackParams {
    alunoId?: string;
    alunoName?: string;
    isConfused: boolean;
}

interface ToggleFeedbackResponse {
    success: boolean;
    isConfused: boolean;
    message: string;
}

/**
 * Toggle student feedback (has a question).
 */
export async function toggleFeedback(
    sessionId: string,
    params: ToggleFeedbackParams
): Promise<ToggleFeedbackResponse> {
    return post<ToggleFeedbackResponse>(
        `/sessions/${sessionId}/feedback`,
        params,
        false // Optional auth
    );
}

/**
 * Get list of students with questions (for teacher polling).
 */
export async function getFeedbackList(sessionId: string): Promise<FeedbackListDTO> {
    return get<FeedbackListDTO>(`/sessions/${sessionId}/feedback`, false);
}
