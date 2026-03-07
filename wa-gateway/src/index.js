require('dotenv').config();

const express = require('express');
const { client } = require('./whatsapp');
const { startWorker } = require('./worker');
const statusRoutes = require('./routes/status');

const app = express();
const PORT = process.env.PORT || 3100;

app.use(express.json());

app.use('/', statusRoutes);

app.get('/health', (req, res) => {
    res.json({ ok: true });
});

app.listen(PORT, () => {
    console.log(`[Server] wa-gateway running on port ${PORT}`);
});

client.initialize();
startWorker();
