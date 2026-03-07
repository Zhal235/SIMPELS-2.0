const express = require('express');
const { getState } = require('../whatsapp');
const { enqueueMessage } = require('../queue');

const router = express.Router();

function checkSecret(req, res, next) {
    const secret = process.env.WA_CALLBACK_SECRET || '';
    if (secret && req.headers['x-wa-secret'] !== secret) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
}

router.get('/status', (req, res) => {
    const state = getState();
    res.json({
        status: state.status,
        phone: state.phone,
        connected_at: state.connectedAt,
    });
});

router.get('/qr', (req, res) => {
    const state = getState();
    if (state.status !== 'waiting_scan' || !state.qrDataUrl) {
        return res.status(404).json({ message: 'No QR available' });
    }
    res.json({ qr: state.qrDataUrl });
});

router.post('/send', checkSecret, async (req, res) => {
    const { log_id, to, message } = req.body;
    if (!log_id || !to || !message) {
        return res.status(422).json({ message: 'log_id, to, and message are required' });
    }

    try {
        const job = await enqueueMessage({ logId: log_id, to, message });
        res.status(202).json({ queued: true, job_id: job.id });
    } catch (err) {
        console.error('[Routes] Failed to enqueue:', err.message);
        res.status(500).json({ message: 'Failed to queue message' });
    }
});

module.exports = router;
