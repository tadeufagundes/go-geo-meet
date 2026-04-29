const test = require('node:test');
const assert = require('node:assert/strict');

const { buildBotJoinUrl, createBotController } = require('./bot');

test('buildBotJoinUrl uses meet.jit.si by default', () => {
    assert.equal(
        buildBotJoinUrl('GoGeo-room-1'),
        'https://meet.jit.si/GoGeo-room-1#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=true'
    );
});

test('buildBotJoinUrl uses the provided conference domain', () => {
    assert.equal(
        buildBotJoinUrl('GoGeo-room-1', 'jitsi.hamburg.ccc.de'),
        'https://jitsi.hamburg.ccc.de/GoGeo-room-1#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=true'
    );
});

test('createBotController proxies close events and browser shutdown', async () => {
    let disconnectedHandler = null;
    let closeCalled = false;

    const browser = {
        on(event, handler) {
            if (event === 'disconnected') {
                disconnectedHandler = handler;
            }
        },
        async close() {
            closeCalled = true;
        },
    };

    const controller = createBotController(browser, 'GoGeo-room-1');

    let closeEventCount = 0;
    controller.on('close', () => {
        closeEventCount += 1;
    });

    disconnectedHandler();
    await controller.close();

    assert.equal(closeEventCount, 1);
    assert.equal(closeCalled, true);
});