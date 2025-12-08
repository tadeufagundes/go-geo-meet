import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { v4 as uuidv4 } from 'uuid';

// Collections
const SESSIONS_COLLECTION = 'meetSessions';

// Types
export interface ClassSession {
    id: string;
    turmaId: string;
    turmaName: string;
    teacherId: string;
    teacherName: string;
    jitsiRoomName: string;
    jitsiRoomPassword: string;
    status: 'scheduled' | 'live' | 'completed';
    scheduledAt: Timestamp;
    startedAt?: Timestamp;
    endedAt?: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface SessionDTO {
    id: string;
    turmaId: string;
    turmaName: string;
    teacherId: string;
    teacherName: string;
    jitsiRoomName: string;
    status: 'scheduled' | 'live' | 'completed';
    scheduledAt: string;
    startedAt?: string;
    endedAt?: string;
}

/**
 * Generate a secure room name for Jitsi.
 */
function generateRoomName(turmaName: string): string {
    const turmaShort = turmaName.replace(/\s+/g, '').substring(0, 10).toUpperCase();
    const timestamp = Date.now().toString(36);
    const random = uuidv4().substring(0, 8);
    return `GoGeo-${turmaShort}-${timestamp}-${random}`;
}

/**
 * Generate a secure password for the Jitsi room.
 */
function generateRoomPassword(length: number = 8): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

/**
 * Create a new class session.
 */
export async function createSession(turmaId: string, turmaName: string): Promise<SessionDTO> {
    const user = auth.currentUser;
    if (!user) throw new Error('Utilizador não autenticado');

    const now = Timestamp.now();
    const roomName = generateRoomName(turmaName);
    const roomPassword = generateRoomPassword();

    const sessionData = {
        turmaId,
        turmaName,
        teacherId: user.uid,
        teacherName: user.displayName || user.email || 'Professor',
        jitsiRoomName: roomName,
        jitsiRoomPassword: roomPassword,
        status: 'scheduled' as const,
        scheduledAt: now,
        createdAt: now,
        updatedAt: now,
    };

    const docRef = await addDoc(collection(db, SESSIONS_COLLECTION), sessionData);

    return {
        id: docRef.id,
        turmaId,
        turmaName,
        teacherId: user.uid,
        teacherName: sessionData.teacherName,
        jitsiRoomName: roomName,
        status: 'scheduled',
        scheduledAt: now.toDate().toISOString(),
    };
}

/**
 * List sessions for the current teacher.
 */
export async function listSessions(): Promise<SessionDTO[]> {
    const user = auth.currentUser;
    if (!user) throw new Error('Utilizador não autenticado');

    const q = query(
        collection(db, SESSIONS_COLLECTION),
        where('teacherId', '==', user.uid),
        orderBy('scheduledAt', 'desc'),
        limit(50)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            turmaId: data.turmaId,
            turmaName: data.turmaName,
            teacherId: data.teacherId,
            teacherName: data.teacherName,
            jitsiRoomName: data.jitsiRoomName,
            status: data.status,
            scheduledAt: data.scheduledAt?.toDate().toISOString() || '',
            startedAt: data.startedAt?.toDate().toISOString(),
            endedAt: data.endedAt?.toDate().toISOString(),
        };
    });
}

/**
 * Get session by ID.
 */
export async function getSession(sessionId: string): Promise<SessionDTO | null> {
    const docRef = doc(db, SESSIONS_COLLECTION, sessionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
        id: docSnap.id,
        turmaId: data.turmaId,
        turmaName: data.turmaName,
        teacherId: data.teacherId,
        teacherName: data.teacherName,
        jitsiRoomName: data.jitsiRoomName,
        status: data.status,
        scheduledAt: data.scheduledAt?.toDate().toISOString() || '',
        startedAt: data.startedAt?.toDate().toISOString(),
        endedAt: data.endedAt?.toDate().toISOString(),
    };
}

/**
 * Start a session (set status to 'live').
 */
export async function startSession(sessionId: string): Promise<void> {
    const docRef = doc(db, SESSIONS_COLLECTION, sessionId);
    await updateDoc(docRef, {
        status: 'live',
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
}

/**
 * End a session (set status to 'completed').
 */
export async function endSession(sessionId: string): Promise<void> {
    const docRef = doc(db, SESSIONS_COLLECTION, sessionId);
    await updateDoc(docRef, {
        status: 'completed',
        endedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
}
