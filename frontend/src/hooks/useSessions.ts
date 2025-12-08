import { useState, useEffect, useCallback } from 'react';
import * as sessionService from '../services/sessionService';
import type { SessionDTO } from '../services/sessionService';

interface UseSessionsOptions {
    autoFetch?: boolean;
}

export function useSessions(options: UseSessionsOptions = {}) {
    const { autoFetch = true } = options;
    const [sessions, setSessions] = useState<SessionDTO[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSessions = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await sessionService.listSessions();
            setSessions(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao carregar sessões';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (autoFetch) {
            fetchSessions();
        }
    }, [autoFetch, fetchSessions]);

    const createSession = useCallback(async (turmaId: string, turmaName: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await sessionService.createSession(turmaId, turmaName);
            // Refresh list after creating
            await fetchSessions();
            return response;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao criar sessão';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [fetchSessions]);

    return {
        sessions,
        isLoading,
        error,
        fetchSessions,
        createSession,
    };
}

export function useSession(sessionId: string | undefined) {
    const [session, setSession] = useState<SessionDTO | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSession = useCallback(async () => {
        if (!sessionId) return;

        setIsLoading(true);
        setError(null);

        try {
            const data = await sessionService.getSession(sessionId);
            setSession(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao carregar sessão';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [sessionId]);

    useEffect(() => {
        fetchSession();
    }, [fetchSession]);

    const startSession = useCallback(async () => {
        if (!sessionId) return;

        try {
            await sessionService.startSession(sessionId);
            setSession((prev) => prev ? { ...prev, status: 'live' } : null);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao iniciar sessão';
            setError(message);
            throw err;
        }
    }, [sessionId]);

    const endSession = useCallback(async () => {
        if (!sessionId) return;

        try {
            await sessionService.endSession(sessionId);
            setSession((prev) => prev ? { ...prev, status: 'completed' } : null);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao encerrar sessão';
            setError(message);
            throw err;
        }
    }, [sessionId]);

    return {
        session,
        isLoading,
        error,
        fetchSession,
        startSession,
        endSession,
    };
}
