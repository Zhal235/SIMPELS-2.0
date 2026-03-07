const { sendMessage } = require('./whatsapp');
const { notifyLaravel } = require('./callback');
const { onMemJob, useRedis } = require('./queue');

const QUEUE_NAME = process.env.WA_QUEUE_NAME || 'wa_messages';

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

async function processJob(job) {
    const { logId, to, message } = job.data;
    console.log(`[Worker] Processing job ${job.id} → ${to}`);
    try {
        await sendMessage(to, message);
        await notifyLaravel(logId, 'sent', null);
        console.log(`[Worker] Job ${job.id} sent successfully`);
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
        const worker = new Worker(QUEUE_NAME, processJob, { connection: createClient(), concurrency: 1 });
        worker.on('error', (err) => console.error('[Worker] Error:', err.message));
        console.log(`[Worker] BullMQ listening on queue: ${QUEUE_NAME}`);
        return worker;
    }

    onMemJob(processJob);
    console.log('[Worker] In-memory queue active (no Redis)');
}

module.exports = { startWorker };
