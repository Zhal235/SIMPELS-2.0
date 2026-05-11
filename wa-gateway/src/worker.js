const { sendMessage } = require('./whatsapp');
const { notifyLaravel } = require('./callback');
const { onMemJob, useRedis, getQueueSize } = require('./queue');

const QUEUE_NAME = process.env.WA_QUEUE_NAME || 'wa_messages';

// Rate limiting configuration
const MIN_DELAY_MS = parseInt(process.env.WA_WORKER_MIN_DELAY_MS || '30000', 10); // 30 detik
const MAX_DELAY_MS = parseInt(process.env.WA_WORKER_MAX_DELAY_MS || '180000', 10); // 3 menit
const MAX_MESSAGES_PER_HOUR = parseInt(process.env.WA_MAX_MESSAGES_PER_HOUR || '100', 10);
const TARGET_COMPLETION_HOURS = parseInt(process.env.WA_TARGET_COMPLETION_HOURS || '8', 10);

// Error yang menandakan Puppeteer/Chromium dalam kondisi rusak → perlu restart
const CRITICAL_ERRORS = [
    'detached Frame',
    'Target closed',
    'Session closed',
    'Protocol error',
    'callFunctionOn timed out',
    'Execution context was destroyed',
    'Cannot find context',
];

function isCriticalPuppeteerError(msg) {
    return CRITICAL_ERRORS.some(e => msg.includes(e));
}

/**
 * Calculate optimal delay based on queue size to spread messages over target hours
 * Prevents WhatsApp ban by not sending too fast
 */
async function calculateAdaptiveDelay(queueSize) {
    // Jika queue kosong atau sedikit, gunakan delay normal
    if (queueSize <= 10) {
        // Normal delay: 30-60 detik
        return Math.floor(Math.random() * (60000 - MIN_DELAY_MS + 1)) + MIN_DELAY_MS;
    }

    // Untuk broadcast besar, spread dalam TARGET_COMPLETION_HOURS jam
    const targetSeconds = TARGET_COMPLETION_HOURS * 3600;
    const optimalDelayMs = (targetSeconds * 1000) / queueSize;

    // Clamp antara MIN dan MAX
    let delayMs = Math.max(MIN_DELAY_MS, Math.min(optimalDelayMs, MAX_DELAY_MS));
    
    // Tambah variasi random ±20% untuk tampak natural
    const variation = delayMs * 0.2;
    delayMs = delayMs + (Math.random() * variation * 2 - variation);

    // Pastikan tidak melebihi rate limit per jam
    const minDelayForHourlyRate = (3600 * 1000) / MAX_MESSAGES_PER_HOUR;
    delayMs = Math.max(delayMs, minDelayForHourlyRate);

    return Math.floor(delayMs);
}

async function processJob(job) {
    const { logId, to, message } = job.data;
    console.log(`[Worker] Processing job ${job.id} → ${to}`);
    
    try {
        await sendMessage(to, message);
        await notifyLaravel(logId, 'sent', null);
        console.log(`[Worker] Job ${job.id} sent successfully`);
        
        // Dapatkan ukuran queue untuk adaptive delay
        let queueSize = 0;
        try {
            if (useRedis()) {
                const { Queue } = require('bullmq');
                const { createClient } = require('./redis');
                const queue = new Queue(QUEUE_NAME, { connection: createClient() });
                queueSize = await queue.getWaitingCount();
            }
        } catch (e) {
            console.warn('[Worker] Failed to get queue size, using default delay');
        }

        // Hitung delay adaptif berdasarkan queue size
        const delayMs = await calculateAdaptiveDelay(queueSize);
        const delaySec = (delayMs / 1000).toFixed(1);
        const queueInfo = queueSize > 0 ? ` (${queueSize} pending)` : '';
        
        console.log(`[Worker] Waiting ${delaySec}s before next message${queueInfo}`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
    } catch (err) {
        const reason = err.message || 'Unknown error';
        console.error(`[Worker] Job ${job.id} failed: ${reason}`);
        if (logId) await notifyLaravel(logId, 'failed', reason).catch(() => {});
        
        // Jika error kritis Puppeteer, exit agar Docker restart container secara clean
        if (isCriticalPuppeteerError(reason)) {
            console.error('[Worker] Critical Puppeteer error detected, restarting container...');
            setTimeout(() => process.exit(1), 2000);
        }
    }
}

function startWorker() {
    if (useRedis()) {
        const { Worker } = require('bullmq');
        const { createClient } = require('./redis');
        const worker = new Worker(QUEUE_NAME, processJob, { 
            connection: createClient(), 
            concurrency: 1,
            limiter: {
                max: MAX_MESSAGES_PER_HOUR,
                duration: 3600 * 1000 // per jam
            }
        });
        worker.on('error', (err) => console.error('[Worker] Error:', err.message));
        console.log(`[Worker] BullMQ listening on queue: ${QUEUE_NAME}`);
        console.log(`[Worker] Rate limit: ${MAX_MESSAGES_PER_HOUR} messages/hour, Target completion: ${TARGET_COMPLETION_HOURS} hours`);
        return worker;
    }

    onMemJob(processJob);
    console.log('[Worker] In-memory queue active (no Redis)');
}

module.exports = { startWorker };
