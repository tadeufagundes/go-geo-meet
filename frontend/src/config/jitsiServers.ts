// Domains known to work with iframe-based Jitsi embeds in this app.
// meet.ffmuc.net is intentionally excluded because it blocks frame embedding via CSP.
export const EMBEDDABLE_JITSI_SERVERS = [
    'meet.jit.si',
    'jitsi.hamburg.ccc.de',
] as const;