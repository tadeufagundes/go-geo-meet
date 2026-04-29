const puppeteer = require('puppeteer');

function buildBotJoinUrl(roomName, conferenceDomain = 'meet.jit.si') {
    return `https://${conferenceDomain}/${roomName}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=true`;
}

function createBotController(browser, roomName) {
    return {
        on(event, handler) {
            if (event === 'close') {
                browser.on('disconnected', handler);
            }
        },
        close: async () => {
            console.log(`[Puppeteer] Closing bot for ${roomName}`);
            await browser.close();
        }
    };
}

/**
 * spawnBot - Joins a Jitsi room as a headless bot to capture audio.
 */
async function spawnBot(sessionId, roomName, conferenceDomain) {
    const jitsiUrl = buildBotJoinUrl(roomName, conferenceDomain);
    
    console.log(`[Puppeteer] Bot joining: ${jitsiUrl}`);

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            '--allow-file-access-from-files',
            '--disable-gesture-requirement-for-media-playback'
        ]
    });

    try {
        const page = await browser.newPage();
        
        // Mock a user display name
        await page.evaluateOnNewDocument(() => {
            localStorage.setItem('display-name', 'LARA AI Assistant');
        });

        await page.goto(jitsiUrl, { waitUntil: 'networkidle2' });

        console.log(`[Puppeteer] Bot is now in room: ${roomName}`);

        // Logic to capture audio would go here
        // 1. Listen for audio tracks
        // 2. Stream to a speech-to-text service
        
        // Return the control object
        return createBotController(browser, roomName);

    } catch (err) {
        console.error('[Puppeteer] Error:', err);
        await browser.close();
        throw err;
    }
}

module.exports = { buildBotJoinUrl, createBotController, spawnBot };
