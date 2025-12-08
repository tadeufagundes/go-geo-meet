import { Response } from 'express';
import { ErrorResponse } from '../types';

export class AppError extends Error {
    constructor(
        public code: string,
        public message: string,
        public userMessage: string,
        public statusCode: number = 400,
        public details?: unknown
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export function createError(
    code: string,
    message: string,
    userMessage: string,
    statusCode: number = 400,
    details?: unknown
): AppError {
    return new AppError(code, message, userMessage, statusCode, details);
}

export function sendError(res: Response, error: AppError | Error, requestId?: string): void {
    const isAppError = error instanceof AppError;

    const response: ErrorResponse = {
        code: isAppError ? error.code : 'INTERNAL_ERROR',
        message: error.message,
        userMessage: isAppError ? error.userMessage : 'Ocorreu um erro inesperado. Tente novamente.',
        details: isAppError ? error.details : undefined,
        timestamp: new Date().toISOString(),
        requestId,
    };

    const statusCode = isAppError ? error.statusCode : 500;

    res.status(statusCode).json(response);
}

// Common errors
export const Errors = {
    unauthorized: () => createError(
        'UNAUTHORIZED',
        'Authentication required',
        'Você precisa estar autenticado para realizar esta ação.',
        401
    ),
    forbidden: () => createError(
        'FORBIDDEN',
        'Access denied',
        'Você não tem permissão para realizar esta ação.',
        403
    ),
    notFound: (resource: string) => createError(
        'NOT_FOUND',
        `${resource} not found`,
        `${resource} não encontrado(a).`,
        404
    ),
    badRequest: (message: string, userMessage: string) => createError(
        'BAD_REQUEST',
        message,
        userMessage,
        400
    ),
    sessionNotLive: () => createError(
        'SESSION_NOT_LIVE',
        'Session is not live',
        'A sessão não está ao vivo.',
        400
    ),
    sessionAlreadyEnded: () => createError(
        'SESSION_ALREADY_ENDED',
        'Session has already ended',
        'A sessão já foi encerrada.',
        400
    ),
};
