import { Response } from 'express';
import * as admin from 'firebase-admin';
import { AuthenticatedRequest } from '../middlewares/auth';
import { JoinSessionDTO, AttendanceLog, ClassSession } from '../types';
import { Errors, sendError } from '../utils/errors';

const db = admin.firestore();
const SESSIONS_COLLECTION = 'meetSessions';
const ATTENDANCE_COLLECTION = 'meetAttendance';

/**
 * Record student joining a session.
 * POST /api/v1/meet/sessions/:sessionId/join
 */
export async function joinSession(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    try {
        const { sessionId } = req.params;
        const { alunoName } = req.body as JoinSessionDTO;
        const user = req.user;

        // Get user ID - either from auth or generate anonymous ID
        const alunoId = user?.uid || `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const displayName = alunoName || user?.name || 'Aluno';

        // Verify session exists and is live
        const sessionDoc = await db.collection(SESSIONS_COLLECTION).doc(sessionId).get();

        if (!sessionDoc.exists) {
            sendError(res, Errors.notFound('Sessão'));
            return;
        }

        const sessionData = sessionDoc.data() as Omit<ClassSession, 'id'>;

        if (sessionData.status !== 'live' && sessionData.status !== 'scheduled') {
            sendError(res, Errors.sessionAlreadyEnded());
            return;
        }

        const now = admin.firestore.Timestamp.now();

        // Create attendance log
        const attendanceData: Omit<AttendanceLog, 'id'> = {
            sessionId,
            alunoId,
            alunoName: displayName,
            joinedAt: now,
        };

        const docRef = await db.collection(ATTENDANCE_COLLECTION).add(attendanceData);

        res.status(201).json({
            success: true,
            attendanceId: docRef.id,
            message: 'Entrada registrada',
            jitsiRoomName: sessionData.jitsiRoomName,
        });
    } catch (error) {
        console.error('Error joining session:', error);
        sendError(res, error as Error);
    }
}

/**
 * Record student leaving a session.
 * POST /api/v1/meet/sessions/:sessionId/leave
 */
export async function leaveSession(
    req: AuthenticatedRequest,
    res: Response
): Promise<void> {
    try {
        const { sessionId } = req.params;
        const user = req.user;
        const { attendanceId } = req.body;

        const now = admin.firestore.Timestamp.now();

        if (attendanceId) {
            // Update specific attendance record
            await db.collection(ATTENDANCE_COLLECTION).doc(attendanceId).update({
                leftAt: now,
            });
        } else if (user) {
            // Find most recent attendance for this user in this session
            const snapshot = await db.collection(ATTENDANCE_COLLECTION)
                .where('sessionId', '==', sessionId)
                .where('alunoId', '==', user.uid)
                .orderBy('joinedAt', 'desc')
                .limit(1)
                .get();

            if (!snapshot.empty) {
                await snapshot.docs[0].ref.update({
                    leftAt: now,
                });
            }
        }

        res.json({
            success: true,
            message: 'Saída registrada',
        });
    } catch (error) {
        console.error('Error leaving session:', error);
        sendError(res, error as Error);
    }
}

/**
 * Get attendance report for a session.
 * GET /api/v1/meet/sessions/:sessionId/attendance
 */
export async function getAttendance(
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

        // Get attendance logs
        const snapshot = await db.collection(ATTENDANCE_COLLECTION)
            .where('sessionId', '==', sessionId)
            .orderBy('joinedAt', 'asc')
            .get();

        const attendance = snapshot.docs.map((doc) => {
            const data = doc.data() as Omit<AttendanceLog, 'id'>;
            return {
                id: doc.id,
                alunoId: data.alunoId,
                alunoName: data.alunoName,
                joinedAt: data.joinedAt.toDate().toISOString(),
                leftAt: data.leftAt?.toDate().toISOString(),
            };
        });

        res.json({ attendance });
    } catch (error) {
        console.error('Error getting attendance:', error);
        sendError(res, error as Error);
    }
}
