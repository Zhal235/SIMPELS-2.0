const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const os = require('os');

let state = {
    status: 'disconnected',
    qrDataUrl: null,
    phone: null,
    connectedAt: null,
};

function buildPuppeteerConfig() {
    const args = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
    ];

    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        return { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, args };
    }

    if (os.platform() === 'linux') {
        return { executablePath: '/usr/bin/chromium', args };
    }

    return { args };
}

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: process.env.WA_AUTH_PATH || path.join(process.cwd(), '.wwebjs_auth'),
    }),
    puppeteer: buildPuppeteerConfig(),
});

client.on('qr', async (qr) => {
    state.status = 'waiting_scan';
    state.qrDataUrl = await qrcode.toDataURL(qr);
    console.log('[WA] QR code generated, waiting for scan...');
});

client.on('authenticated', () => {
    state.status = 'authenticated';
    state.qrDataUrl = null;
    console.log('[WA] Authenticated');
});

client.on('ready', () => {
    const info = client.info;
    state.status = 'connected';
    state.phone = info?.wid?.user ? `+${info.wid.user}` : 'unknown';
    state.connectedAt = new Date().toISOString();
    console.log(`[WA] Ready — connected as ${state.phone}`);
});

client.on('disconnected', (reason) => {
    state.status = 'disconnected';
    state.phone = null;
    state.connectedAt = null;
    console.log(`[WA] Disconnected: ${reason}`);
    setTimeout(() => client.initialize(), 5000);
});

client.on('auth_failure', () => {
    state.status = 'auth_failed';
    console.error('[WA] Authentication failed');
});

async function sendMessage(to, message) {
    if (state.status !== 'connected') {
        throw new Error(`WA client not connected (status: ${state.status})`);
    }

    const chatId = to.replace(/\D/g, '').replace(/^0/, '62') + '@c.us';
    await client.sendMessage(chatId, message);
}

function getState() {
    return { ...state };
}

module.exports = { client, sendMessage, getState };
