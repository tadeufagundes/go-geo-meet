import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { Errors, sendError } from '../utils/errors';

export interface AuthenticatedRequest extends Request {
    user?: admin.auth.DecodedIdToken;
}

/**
 * Middleware to verify Firebase Auth token.
 * Attaches decoded user to request object.
 */
export async function authMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        sendError(res, Errors.unauthorized());
        return;
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        sendError(res, Errors.unauthorized());
    }
}

/**
 * Optional auth middleware - doesn't fail if no token provided.
 * Useful for endpoints that work differently for authenticated vs anonymous users.
 */
export async function optionalAuthMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next();
        return;
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
    } catch (error) {
        // Token invalid, but we continue without user
        console.warn('Optional auth failed:', error);
    }

    next();
}
