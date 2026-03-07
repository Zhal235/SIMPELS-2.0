const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const os = require('os');
const fs = require('fs');

const AUTH_PATH = process.env.WA_AUTH_PATH || path.join(process.cwd(), '.wwebjs_auth');

function clearChromiumLocks(authPath) {
    const patterns = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];
    try {
        const entries = fs.readdirSync(authPath, { withFileTypes: true });
        for (const entry of entries) {
            const sessionDir = path.join(authPath, entry.name);
            if (entry.isDirectory()) {
                for (const p of patterns) {
                    const lockFile = path.join(sessionDir, p);
                    if (fs.existsSync(lockFile)) {
                        fs.rmSync(lockFile, { force: true });
                        console.log(`[WA] Removed stale lock: ${lockFile}`);
                    }
                }
            }
        }
    } catch (e) {
        // auth dir may not exist yet on first run
    }
}

function clearSession(authPath) {
    try {
        const sessionDir = path.join(authPath, 'session');
        if (fs.existsSync(sessionDir)) {
            fs.rmSync(sessionDir, { recursive: true, force: true });
            console.log('[WA] Cleared corrupt session data');
        }
    } catch (e) {
        console.error('[WA] Failed to clear session:', e.message);
    }
}

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
        '--disable-singleton-lock',
        '--disable-extensions',
        '--disable-default-apps',
        '--no-first-run',
        '--disable-background-networking',
        '--disable-sync',
        '--metrics-recording-only',
        '--disable-background-timer-throttling',
    ];

    const base = { args, protocolTimeout: 120000 };

    const execPath = process.env.PUPPETEER_EXECUTABLE_PATH
        || (os.platform() === 'linux' ? '/usr/bin/google-chrome-stable' : undefined);

    return execPath ? { ...base, executablePath: execPath } : base;
}

clearChromiumLocks(AUTH_PATH);

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: AUTH_PATH,
    }),
    puppeteer: buildPuppeteerConfig(),
    restartOnAuthFail: false,
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

    // Deteksi halaman WA Web crash atau navigate away
    const page = client.pupPage;
    if (page) {
        page.on('crash', () => {
            console.error('[WA] Page crashed, exiting for clean restart...');
            setTimeout(() => process.exit(1), 500);
        });
        page.on('close', () => {
            console.error('[WA] Page closed unexpectedly, exiting...');
            setTimeout(() => process.exit(1), 500);
        });
    }
});

client.on('disconnected', (reason) => {
    state.status = 'disconnected';
    state.phone = null;
    state.connectedAt = null;
    console.log(`[WA] Disconnected: ${reason}`);
    // Jika remote logout (WA invalidate session), bersihkan session agar QR muncul saat restart
    if (reason === 'LOGOUT') {
        clearSession(AUTH_PATH);
    }
    // Exit agar Docker Swarm restart container secara clean (bukan loop re-init)
    setTimeout(() => process.exit(1), 1000);
});

client.on('auth_failure', (msg) => {
    state.status = 'auth_failed';
    console.error('[WA] Authentication failed:', msg);
    // Bersihkan session rusak agar restart menghasilkan QR baru
    clearSession(AUTH_PATH);
    setTimeout(() => process.exit(1), 1000);
});

function randomDelay(minMs, maxMs) {
    const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const MIN_DELAY_MS = parseInt(process.env.WA_MIN_DELAY_MS || '3000', 10);
const MAX_DELAY_MS = parseInt(process.env.WA_MAX_DELAY_MS || '8000', 10);
const TYPING_ENABLED = process.env.WA_TYPING_SIMULATION !== 'false';

async function sendMessage(to, message) {
    if (state.status !== 'connected') {
        throw new Error(`WA client not connected (status: ${state.status})`);
    }

    const chatId = to.replace(/\D/g, '').replace(/^0/, '62') + '@c.us';

    // Jeda acak sebelum kirim agar tidak terdeteksi sebagai bot
    await randomDelay(MIN_DELAY_MS, MAX_DELAY_MS);

    if (TYPING_ENABLED) {
        try {
            const chat = await client.getChatById(chatId);
            await chat.sendStateTyping();
            // Simulasi waktu mengetik berdasarkan panjang pesan (50ms/karakter, min 1s max 4s)
            const typingMs = Math.min(Math.max(message.length * 50, 1000), 4000);
            await randomDelay(typingMs, typingMs + 500);
            await chat.clearState();
        } catch {
            // Typing simulation tidak kritis, lanjut kirim jika gagal
        }
    }

    await client.sendMessage(chatId, message);
}

function getState() {
    return { ...state };
}

module.exports = { client, sendMessage, getState };
