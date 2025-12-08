import {
    collection,
    doc,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    Timestamp,
    serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase';

// Collections
const ATTENDANCE_COLLECTION = 'meetAttendance';

export interface AttendanceLog {
    id: string;
    sessionId: string;
    alunoId: string;
    alunoName: string;
    joinedAt: string;
    leftAt?: string;
}

/**
 * Record student joining a session.
 */
export async function joinSession(
    sessionId: string,
    alunoName: string
): Promise<{ attendanceId: string }> {
    const user = auth.currentUser;
    const alunoId = user?.uid || `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const displayName = alunoName || user?.displayName || 'Aluno';

    const attendanceData = {
        sessionId,
        alunoId,
        alunoName: displayName,
        joinedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, ATTENDANCE_COLLECTION), attendanceData);

    return { attendanceId: docRef.id };
}

/**
 * Record student leaving a session.
 */
export async function leaveSession(
    sessionId: string,
    attendanceId?: string
): Promise<void> {
    if (attendanceId) {
        const docRef = doc(db, ATTENDANCE_COLLECTION, attendanceId);
        await updateDoc(docRef, {
            leftAt: serverTimestamp(),
        });
    } else {
        // Find most recent attendance for this user in this session
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
            collection(db, ATTENDANCE_COLLECTION),
            where('sessionId', '==', sessionId),
            where('alunoId', '==', user.uid),
            orderBy('joinedAt', 'desc'),
            limit(1)
        );

        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            await updateDoc(snapshot.docs[0].ref, {
                leftAt: serverTimestamp(),
            });
        }
    }
}

/**
 * Get attendance for a session (for teacher).
 */
export async function getAttendance(sessionId: string): Promise<AttendanceLog[]> {
    const q = query(
        collection(db, ATTENDANCE_COLLECTION),
        where('sessionId', '==', sessionId),
        orderBy('joinedAt', 'asc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            sessionId: data.sessionId,
            alunoId: data.alunoId,
            alunoName: data.alunoName,
            joinedAt: data.joinedAt?.toDate().toISOString() || '',
            leftAt: data.leftAt?.toDate().toISOString(),
        };
    });
}
