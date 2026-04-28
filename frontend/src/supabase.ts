import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
    console.warn('Supabase credentials missing. Real-time features might not work.');
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);

/**
 * Go Geo Meet Channels
 * 
 * We use Supabase Realtime for:
 * 1. Room Signaling (moving students to breakout rooms)
 * 2. AI Feedback Broadcast
 * 3. Presence (who is in which room)
 */
export const getRoomChannel = (sessionId: string) => {
    return supabase.channel(`room:${sessionId}`, {
        config: {
            presence: {
                key: 'user',
            },
        },
    });
};
