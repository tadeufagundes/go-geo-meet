import {
    doc,
    setDoc,
    getDocs,
    query,
    where,
    collection,
    serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase';

// Collections
const FEEDBACK_COLLECTION = 'meetFeedback';

export interface ConfusedStudent {
    alunoId: string;
    alunoName: string;
    since: string;
}

export interface FeedbackListDTO {
    confusedCount: number;
    students: ConfusedStudent[];
}

/**
 * Toggle student feedback (has a question).
 */
export async function toggleFeedback(
    sessionId: string,
    params: { alunoId?: string; alunoName?: string; isConfused: boolean }
): Promise<{ isConfused: boolean }> {
    const user = auth.currentUser;
    const alunoId = params.alunoId || user?.uid || `anon_${Date.now()}`;
    const alunoName = params.alunoName || user?.displayName || 'Aluno';

    // Use composite ID for upsert
    const feedbackId = `${sessionId}_${alunoId}`;
    const feedbackRef = doc(db, FEEDBACK_COLLECTION, feedbackId);

    await setDoc(feedbackRef, {
        sessionId,
        alunoId,
        alunoName,
        isConfused: params.isConfused,
        updatedAt: serverTimestamp(),
    }, { merge: true });

    return { isConfused: params.isConfused };
}

/**
 * Get list of students with questions (for teacher polling).
 */
export async function getFeedbackList(sessionId: string): Promise<FeedbackListDTO> {
    const q = query(
        collection(db, FEEDBACK_COLLECTION),
        where('sessionId', '==', sessionId),
        where('isConfused', '==', true)
    );

    const snapshot = await getDocs(q);

    const students: ConfusedStudent[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            alunoId: data.alunoId,
            alunoName: data.alunoName,
            since: data.updatedAt?.toDate().toISOString() || new Date().toISOString(),
        };
    });

    return {
        confusedCount: students.length,
        students,
    };
}
