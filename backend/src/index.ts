import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import meetRoutes from './routes/meetRoutes';

// Initialize Firebase Admin
admin.initializeApp();

// Create Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'gogeo-meet-api',
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use('/api/v1/meet', meetRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found`,
        userMessage: 'Recurso não encontrado.',
        timestamp: new Date().toISOString(),
    });
});

// Export the Express app as a Cloud Function
export const api = functions.https.onRequest(app);

// ============================================
// Firestore Triggers (optional, for automation)
// ============================================

/**
 * When a session ends, clear all feedback for that session.
 */
export const onSessionEnd = functions.firestore
    .document('meetSessions/{sessionId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();

        // Check if status changed to 'completed'
        if (before.status !== 'completed' && after.status === 'completed') {
            const sessionId = context.params.sessionId;

            // Clear feedback for this session
            const feedbackSnapshot = await admin.firestore()
                .collection('meetFeedback')
                .where('sessionId', '==', sessionId)
                .get();

            if (!feedbackSnapshot.empty) {
                const batch = admin.firestore().batch();
                feedbackSnapshot.docs.forEach((doc) => {
                    batch.delete(doc.ref);
                });
                await batch.commit();

                console.log(`Cleared ${feedbackSnapshot.size} feedback entries for session ${sessionId}`);
            }

            // Mark all open attendance logs as left
            const attendanceSnapshot = await admin.firestore()
                .collection('meetAttendance')
                .where('sessionId', '==', sessionId)
                .where('leftAt', '==', null)
                .get();

            if (!attendanceSnapshot.empty) {
                const batch = admin.firestore().batch();
                const now = admin.firestore.Timestamp.now();

                attendanceSnapshot.docs.forEach((doc) => {
                    batch.update(doc.ref, { leftAt: now });
                });
                await batch.commit();

                console.log(`Marked ${attendanceSnapshot.size} attendance logs as left for session ${sessionId}`);
            }
        }
    });
