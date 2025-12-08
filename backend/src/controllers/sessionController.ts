import { Response } from 'express';
import * as admin from 'firebase-admin';
import { AuthenticatedRequest } from '../middlewares/auth';
import {
    CreateSessionDTO,
    CreateSessionResponseDTO,
    SessionDTO,
    ClassSession,
    SessionStatus
} from '../types';
import {
    generateRoomName,
    generateRoomPassword,
    generateJitsiUrl
} from '../utils/roomNameGenerator';
import { Errors, sendError, AppError } from '../utils/errors';

const db = admin.firestore();
const SESSIONS_COLLECTION = 'meetSessions';

/**
 * Create a new class session.
 * POST /api/v1/meet/sessions
 */
export async function createSession(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    try {
        const user = req.user;
        if (!user) {
            sendError(res, Errors.unauthorized());
            return;
        }

        const { turmaId, turmaName, scheduledAt } = req.body as CreateSessionDTO;

        // Validate required fields
        if (!turmaId || !turmaName) {
            sendError(res, Errors.badRequest(
                'Missing required fields',
                'É necessário informar a turma.'
            ));
            return;
        }

        const now = admin.firestore.Timestamp.now();
        const roomName = generateRoomName(turmaName);
        const roomPassword = generateRoomPassword();

        const sessionData: Omit<ClassSession, 'id'> = {
            turmaId,
            turmaName,
            teacherId: user.uid,
            teacherName: user.name || user.email || 'Professor',
            jitsiRoomName: roomName,
            jitsiRoomPassword: roomPassword,
            status: 'scheduled',
            scheduledAt: scheduledAt
                ? admin.firestore.Timestamp.fromDate(new Date(scheduledAt))
                : now,
            createdAt: now,
            updatedAt: now,
        };

        const docRef = await db.collection(SESSIONS_COLLECTION).add(sessionData);

        const response: CreateSessionResponseDTO = {
            id: docRef.id,
            jitsiRoomName: roomName,
            jitsiRoomPassword: roomPassword,
            joinUrl: generateJitsiUrl(roomName),
            status: 'scheduled',
        };

        res.status(201).json(response);
    } catch (error) {
        console.error('Error creating session:', error);
        sendError(res, error as Error);
    }
}

/**
 * Get session by ID.
 * GET /api/v1/meet/sessions/:sessionId
 */
export async function getSession(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    try {
        const { sessionId } = req.params;

        const doc = await db.collection(SESSIONS_COLLECTION).doc(sessionId).get();

        if (!doc.exists) {
            sendError(res, Errors.notFound('Sessão'));
            return;
        }

        const data = doc.data() as Omit<ClassSession, 'id'>;

        const response: SessionDTO = {
            id: doc.id,
            turmaId: data.turmaId,
            turmaName: data.turmaName,
            teacherId: data.teacherId,
            teacherName: data.teacherName,
            jitsiRoomName: data.jitsiRoomName,
            status: data.status,
            scheduledAt: data.scheduledAt.toDate().toISOString(),
            startedAt: data.startedAt?.toDate().toISOString(),
            endedAt: data.endedAt?.toDate().toISOString(),
        };

        res.json(response);
    } catch (error) {
        console.error('Error getting session:', error);
        sendError(res, error as Error);
    }
}

/**
 * List sessions for a teacher.
 * GET /api/v1/meet/sessions
 */
export async function listSessions(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    try {
        const user = req.user;
        if (!user) {
            sendError(res, Errors.unauthorized());
            return;
        }

        const status = req.query.status as SessionStatus | undefined;

        let query = db.collection(SESSIONS_COLLECTION)
            .where('teacherId', '==', user.uid)
            .orderBy('scheduledAt', 'desc')
            .limit(50);

        if (status) {
            query = query.where('status', '==', status);
        }

        const snapshot = await query.get();

        const sessions: SessionDTO[] = snapshot.docs.map((doc) => {
            const data = doc.data() as Omit<ClassSession, 'id'>;
            return {
                id: doc.id,
                turmaId: data.turmaId,
                turmaName: data.turmaName,
                teacherId: data.teacherId,
                teacherName: data.teacherName,
                jitsiRoomName: data.jitsiRoomName,
                status: data.status,
                scheduledAt: data.scheduledAt.toDate().toISOString(),
                startedAt: data.startedAt?.toDate().toISOString(),
                endedAt: data.endedAt?.toDate().toISOString(),
            };
        });

        res.json({ sessions });
    } catch (error) {
        console.error('Error listing sessions:', error);
        sendError(res, error as Error);
    }
}

/**
 * Start a session (set status to 'live').
 * PATCH /api/v1/meet/sessions/:sessionId/start
 */
export async function startSession(
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
        const docRef = db.collection(SESSIONS_COLLECTION).doc(sessionId);
        const doc = await docRef.get();

        if (!doc.exists) {
            sendError(res, Errors.notFound('Sessão'));
            return;
        }

        const data = doc.data() as Omit<ClassSession, 'id'>;

        // Check ownership
        if (data.teacherId !== user.uid) {
            sendError(res, Errors.forbidden());
            return;
        }

        // Check if already ended
        if (data.status === 'completed') {
            sendError(res, Errors.sessionAlreadyEnded());
            return;
        }

        const now = admin.firestore.Timestamp.now();

        await docRef.update({
            status: 'live',
            startedAt: now,
            updatedAt: now,
        });

        res.json({
            success: true,
            message: 'Sessão iniciada',
            jitsiRoomName: data.jitsiRoomName,
            joinUrl: generateJitsiUrl(data.jitsiRoomName),
        });
    } catch (error) {
        console.error('Error starting session:', error);
        sendError(res, error as Error);
    }
}

/**
 * End a session (set status to 'completed').
 * PATCH /api/v1/meet/sessions/:sessionId/end
 */
export async function endSession(
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
        const docRef = db.collection(SESSIONS_COLLECTION).doc(sessionId);
        const doc = await docRef.get();

        if (!doc.exists) {
            sendError(res, Errors.notFound('Sessão'));
            return;
        }

        const data = doc.data() as Omit<ClassSession, 'id'>;

        // Check ownership
        if (data.teacherId !== user.uid) {
            sendError(res, Errors.forbidden());
            return;
        }

        const now = admin.firestore.Timestamp.now();

        await docRef.update({
            status: 'completed',
            endedAt: now,
            updatedAt: now,
        });

        res.json({
            success: true,
            message: 'Sessão encerrada',
        });
    } catch (error) {
        console.error('Error ending session:', error);
        sendError(res, error as Error);
    }
}
