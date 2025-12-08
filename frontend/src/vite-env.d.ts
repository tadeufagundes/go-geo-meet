/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_FIREBASE_API_KEY: string;
    readonly VITE_FIREBASE_AUTH_DOMAIN: string;
    readonly VITE_FIREBASE_PROJECT_ID: string;
    readonly VITE_FIREBASE_STORAGE_BUCKET: string;
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
    readonly VITE_FIREBASE_APP_ID: string;
    readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

// Jitsi Meet External API types
declare global {
    interface Window {
        JitsiMeetExternalAPI: typeof JitsiMeetExternalAPI;
    }

    class JitsiMeetExternalAPI {
        constructor(domain: string, options: JitsiMeetExternalAPIOptions);
        dispose(): void;
        executeCommand(command: string, ...args: unknown[]): void;
        addListener(event: string, callback: (...args: unknown[]) => void): void;
        removeListener(event: string, callback: (...args: unknown[]) => void): void;
        getParticipantsInfo(): JitsiParticipant[];
        getNumberOfParticipants(): number;
    }

    interface JitsiMeetExternalAPIOptions {
        roomName: string;
        parentNode: HTMLElement;
        width?: string | number;
        height?: string | number;
        configOverwrite?: Record<string, unknown>;
        interfaceConfigOverwrite?: Record<string, unknown>;
        userInfo?: {
            displayName?: string;
            email?: string;
        };
        password?: string;
        jwt?: string;
    }

    interface JitsiParticipant {
        participantId: string;
        displayName: string;
        avatarURL?: string;
    }
}

export { };
