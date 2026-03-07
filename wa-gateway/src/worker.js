const { sendMessage } = require('./whatsapp');
const { notifyLaravel } = require('./callback');
const { onMemJob, useRedis } = require('./queue');

const QUEUE_NAME = process.env.WA_QUEUE_NAME || 'wa:messages';

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
    }
}

function startWorker() {
    if (useRedis()) {
        const { Worker } = require('bullmq');
        const { createClient } = require('./redis');
        const worker = new Worker(QUEUE_NAME, processJob, { connection: createClient(), concurrency: 3 });
        worker.on('error', (err) => console.error('[Worker] Error:', err.message));
        console.log(`[Worker] BullMQ listening on queue: ${QUEUE_NAME}`);
        return worker;
    }

    onMemJob(processJob);
    console.log('[Worker] In-memory queue active (no Redis)');
}

module.exports = { startWorker };
