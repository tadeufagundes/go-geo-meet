import { useState, useCallback, useEffect, useRef } from 'react';
import * as feedbackService from '../services/feedbackService';

interface UseFeedbackOptions {
    sessionId: string;
    alunoId: string;
    alunoName: string;
}

export function useFeedback(options: UseFeedbackOptions) {
    const { sessionId, alunoId, alunoName } = options;
    const [isConfused, setIsConfused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toggleFeedback = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const newState = !isConfused;

            const response = await feedbackService.toggleFeedback(sessionId, {
                alunoId,
                alunoName,
                isConfused: newState,
            });

            setIsConfused(response.isConfused);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao enviar feedback';
            setError(message);
            console.error('Feedback error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [isConfused, sessionId, alunoId, alunoName]);

    return {
        isConfused,
        isLoading,
        error,
        toggleFeedback,
    };
}

// Hook for teacher to poll student feedback
interface UseTeacherFeedbackOptions {
    sessionId: string;
    pollingInterval?: number;
    enabled?: boolean;
}

interface ConfusedStudent {
    alunoId: string;
    alunoName: string;
    since: Date;
}

export function useTeacherFeedback(options: UseTeacherFeedbackOptions) {
    const { sessionId, pollingInterval = 10000, enabled = true } = options;
    const [confusedStudents, setConfusedStudents] = useState<ConfusedStudent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchFeedback = useCallback(async () => {
        if (!enabled || !sessionId) return;

        setIsLoading(true);
        try {
            const response = await feedbackService.getFeedbackList(sessionId);

            setConfusedStudents(
                response.students.map((s) => ({
                    alunoId: s.alunoId,
                    alunoName: s.alunoName,
                    since: new Date(s.since),
                }))
            );
        } catch (err) {
            console.error('Error fetching feedback:', err);
        } finally {
            setIsLoading(false);
        }
    }, [sessionId, enabled]);

    useEffect(() => {
        if (enabled) {
            fetchFeedback();
            intervalRef.current = setInterval(fetchFeedback, pollingInterval);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [fetchFeedback, pollingInterval, enabled]);

    const pickRandomStudent = useCallback(() => {
        if (confusedStudents.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * confusedStudents.length);
        return confusedStudents[randomIndex];
    }, [confusedStudents]);

    return {
        confusedStudents,
        confusedCount: confusedStudents.length,
        isLoading,
        pickRandomStudent,
        refresh: fetchFeedback,
    };
}
