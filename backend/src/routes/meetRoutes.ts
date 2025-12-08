import { Router } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/auth';
import {
    createSession,
    getSession,
    listSessions,
    startSession,
    endSession,
} from '../controllers/sessionController';
import {
    joinSession,
    leaveSession,
    getAttendance,
} from '../controllers/attendanceController';
import {
    toggleFeedback,
    getFeedback,
    clearFeedback,
} from '../controllers/feedbackController';

const router = Router();

// ============================================
// Session Management Routes
// ============================================

// Create a new session (teacher only)
router.post('/sessions', authMiddleware, createSession);

// List teacher's sessions
router.get('/sessions', authMiddleware, listSessions);

// Get session details (can be accessed by students with optional auth)
router.get('/sessions/:sessionId', optionalAuthMiddleware, getSession);

// Start a session (teacher only)
router.patch('/sessions/:sessionId/start', authMiddleware, startSession);

// End a session (teacher only)
router.patch('/sessions/:sessionId/end', authMiddleware, endSession);

// ============================================
// Attendance Routes
// ============================================

// Student joins session (optional auth for anonymous join)
router.post('/sessions/:sessionId/join', optionalAuthMiddleware, joinSession);

// Student leaves session
router.post('/sessions/:sessionId/leave', optionalAuthMiddleware, leaveSession);

// Get attendance report (teacher only)
router.get('/sessions/:sessionId/attendance', authMiddleware, getAttendance);

// ============================================
// Feedback Routes
// ============================================

// Toggle student feedback (optional auth)
router.post('/sessions/:sessionId/feedback', optionalAuthMiddleware, toggleFeedback);

// Get feedback list (can be polled by teacher)
router.get('/sessions/:sessionId/feedback', optionalAuthMiddleware, getFeedback);

// Clear all feedback for session (teacher only)
router.delete('/sessions/:sessionId/feedback', authMiddleware, clearFeedback);

export default router;
