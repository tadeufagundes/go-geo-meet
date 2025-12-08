import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a secure, non-guessable room name for Jitsi.
 * Format: GoGeo-{turmaShort}-{timestamp}-{random}
 */
export function generateRoomName(turmaName: string): string {
    const turmaShort = turmaName
        .replace(/\s+/g, '')
        .substring(0, 10)
        .toUpperCase();
    const timestamp = Date.now().toString(36);
    const random = uuidv4().substring(0, 8);

    return `GoGeo-${turmaShort}-${timestamp}-${random}`;
}

/**
 * Generates a secure random password for the Jitsi room.
 */
export function generateRoomPassword(length: number = 12): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

/**
 * Generates the full Jitsi join URL with optional password.
 */
export function generateJitsiUrl(roomName: string, password?: string): string {
    const baseUrl = `https://meet.jit.si/${roomName}`;
    const params = new URLSearchParams({
        'config.prejoinPageEnabled': 'false',
    });

    if (password) {
        params.set('config.startWithPassword', password);
    }

    return `${baseUrl}#${params.toString()}`;
}
