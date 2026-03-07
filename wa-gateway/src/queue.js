const QUEUE_NAME = process.env.WA_QUEUE_NAME || 'wa:messages';

let bullQueue = null;
const memQueue = [];
const memListeners = [];

function useRedis() {
    return !!(process.env.REDIS_URL);
}

function getBullQueue() {
    if (!bullQueue) {
        const { Queue } = require('bullmq');
        const { createClient } = require('./redis');
        bullQueue = new Queue(QUEUE_NAME, {
            connection: createClient(),
            defaultJobOptions: { attempts: 1, removeOnComplete: 500, removeOnFail: 1000 },
        });
    }
    return bullQueue;
}

async function enqueueMessage(data) {
    if (useRedis()) {
        return getBullQueue().add('send', data);
    }
    const job = { id: Date.now().toString(), data };
    for (const fn of memListeners) fn(job);
    return job;
}

function onMemJob(fn) {
    memListeners.push(fn);
}

module.exports = { enqueueMessage, onMemJob, useRedis };
