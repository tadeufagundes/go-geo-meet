import { useState, useEffect, useCallback } from 'react';
import {
    signInWithEmailAndPassword,
    signInAnonymously as firebaseSignInAnonymously,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile,
    User
} from 'firebase/auth';
import { auth } from '../firebase';

interface UseAuthReturn {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    signIn: (email: string, password: string) => Promise<void>;
    signInAnonymously: (displayName: string) => Promise<void>;
    signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);

        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao fazer login';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const signInAnonymously = useCallback(async (displayName: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await firebaseSignInAnonymously(auth);
            if (result.user) {
                await updateProfile(result.user, {
                    displayName: displayName
                });
                // Force update user state
                setUser({ ...result.user, displayName });
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao entrar como convidado';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const signOut = useCallback(async () => {
        setIsLoading(true);
        try {
            await firebaseSignOut(auth);
        } catch (err) {
            console.error('Sign out error:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        user,
        isLoading,
        error,
        signIn,
        signInAnonymously,
        signOut,
    };
}

