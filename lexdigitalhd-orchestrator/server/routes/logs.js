// server/routes/logs.js
const express = require('express');
const router = express.Router();
const { addClient } = require('../services/sseManager');

// Endpoint: GET /api/logs
router.get('/', (req, res) => {
    addClient(req, res);
});

module.exports = router;