const https = require('https');
const http = require('http');
const { URL } = require('url');

const CALLBACK_URL = process.env.LARAVEL_CALLBACK_URL || 'http://localhost:8001/api/wa/callback';
const CALLBACK_SECRET = process.env.WA_CALLBACK_SECRET || '';

async function notifyLaravel(logId, status, errorReason) {
    const payload = JSON.stringify({
        log_id: logId,
        status,
        error_reason: errorReason,
        sent_at: status === 'sent' ? new Date().toISOString() : null,
    });

    const url = new URL(CALLBACK_URL);
    const transport = url.protocol === 'https:' ? https : http;

    return new Promise((resolve, reject) => {
        const req = transport.request(
            {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload),
                    'X-WA-Secret': CALLBACK_SECRET,
                },
            },
            (res) => {
                res.on('data', () => {});
                res.on('end', () => resolve());
            }
        );

        req.on('error', (err) => {
            console.error(`[Callback] Failed to notify Laravel for log ${logId}: ${err.message}`);
            reject(err);
        });

        req.write(payload);
        req.end();
    });
}

module.exports = { notifyLaravel };
