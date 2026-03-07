const Redis = require('ioredis');

let instance = null;

function createClient() {
    if (!instance) {
        instance = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
            maxRetriesPerRequest: null,
        });

        instance.on('error', (err) => {
            console.error('[Redis] Connection error:', err.message);
        });

        instance.on('connect', () => {
            console.log('[Redis] Connected');
        });
    }
    return instance;
}

module.exports = { createClient };
