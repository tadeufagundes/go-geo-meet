import { Response } from 'express';
import * as admin from 'firebase-admin';
import { AuthenticatedRequest } from '../middlewares/auth';
import { ToggleFeedbackDTO, FeedbackListDTO, SilentFeedback, ClassSession } from '../types';
import { Errors, sendError } from '../utils/errors';

const db = admin.firestore();
const SESSIONS_COLLECTION = 'meetSessions';
const FEEDBACK_COLLECTION = 'meetFeedback';

/**
 * Toggle silent feedback status (student has a question).
 * POST /api/v1/meet/sessions/:sessionId/feedback
 */
export async function toggleFeedback(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    try {
        const { sessionId } = req.params;
        const { isConfused } = req.body as ToggleFeedbackDTO;
        const user = req.user;

        // Get user ID and name
        const alunoId = user?.uid || req.body.alunoId;
        const alunoName = req.body.alunoName || user?.name || 'Aluno';

        if (!alunoId) {
            sendError(res, Errors.badRequest(
                'Missing alunoId',
                'É necessário identificar o aluno.'
            ));
            return;
        }

        // Verify session exists
        const sessionDoc = await db.collection(SESSIONS_COLLECTION).doc(sessionId).get();

        if (!sessionDoc.exists) {
            sendError(res, Errors.notFound('Sessão'));
            return;
        }

        const now = admin.firestore.Timestamp.now();

        // Use composite ID for upsert
        const feedbackId = `${sessionId}_${alunoId}`;
        const feedbackRef = db.collection(FEEDBACK_COLLECTION).doc(feedbackId);

        await feedbackRef.set({
            sessionId,
            alunoId,
            alunoName,
            isConfused: isConfused ?? true,
            updatedAt: now,
        }, { merge: true });

        res.json({
            success: true,
            isConfused: isConfused ?? true,
            message: isConfused ? 'Dúvida registrada' : 'Dúvida removida',
        });
    } catch (error) {
        console.error('Error toggling feedback:', error);
        sendError(res, error as Error);
    }
}

/**
 * Get list of students with questions (for teacher polling).
 * GET /api/v1/meet/sessions/:sessionId/feedback
 */
export async function getFeedback(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    try {
        const { sessionId } = req.params;

        // Get all feedback for this session where isConfused is true
        const snapshot = await db.collection(FEEDBACK_COLLECTION)
            .where('sessionId', '==', sessionId)
            .where('isConfused', '==', true)
            .get();

        const students = snapshot.docs.map((doc) => {
            const data = doc.data() as SilentFeedback;
            return {
                alunoId: data.alunoId,
                alunoName: data.alunoName,
                since: data.updatedAt.toDate().toISOString(),
            };
        });

        const response: FeedbackListDTO = {
            confusedCount: students.length,
            students,
        };

        res.json(response);
    } catch (error) {
        console.error('Error getting feedback:', error);
        sendError(res, error as Error);
    }
}

/**
 * Clear all feedback for a session (when session ends).
 * DELETE /api/v1/meet/sessions/:sessionId/feedback
 */
export async function clearFeedback(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    try {
        const user = req.user;
        if (!user) {
            sendError(res, Errors.unauthorized());
            return;
        }

        const { sessionId } = req.params;

        // Verify session exists and user is the teacher
        const sessionDoc = await db.collection(SESSIONS_COLLECTION).doc(sessionId).get();

        if (!sessionDoc.exists) {
            sendError(res, Errors.notFound('Sessão'));
            return;
        }

        const sessionData = sessionDoc.data() as Omit<ClassSession, 'id'>;

        if (sessionData.teacherId !== user.uid) {
            sendError(res, Errors.forbidden());
            return;
        }

        // Delete all feedback for this session
        const snapshot = await db.collection(FEEDBACK_COLLECTION)
            .where('sessionId', '==', sessionId)
            .get();

        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        res.json({
            success: true,
            message: 'Feedback limpo',
            deletedCount: snapshot.size,
        });
    } catch (error) {
        console.error('Error clearing feedback:', error);
        sendError(res, error as Error);
    }
}
