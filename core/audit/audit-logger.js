'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function getLogDir() {
    return process.env.AUDIT_LOG_DIR || path.join(__dirname, '..', '..', 'logs', 'audit');
}

function ensureLogDir() {
    fs.mkdirSync(getLogDir(), { recursive: true });
}

function getLogFilePath(date) {
    const d = date || new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return path.join(getLogDir(), `audit-${year}-${month}-${day}.log`);
}

function hashApiKey(apiKey) {
    if (!apiKey) return null;
    return crypto.createHash('sha256').update(apiKey).digest('hex').substring(0, 16);
}

function appendAuditEvent(event, resource, apiKey, status, metadata = {}) {
    ensureLogDir();

    const entry = {
        timestamp: new Date().toISOString(),
        event,
        resource,
        apiKeyHash: hashApiKey(apiKey),
        status,
        requestId: crypto.randomUUID(),
        ...metadata
    };

    fs.appendFileSync(getLogFilePath(), JSON.stringify(entry) + '\n', 'utf8');
    return entry;
}

function createAuditLogger() {
    return function auditLogger(req, res, next) {
        const apiKey = req.headers['x-api-key'];
        const event = apiKey ? 'request' : 'auth_failure';
        const status = apiKey ? 'authorized' : 'unauthorized';
        appendAuditEvent(event, req.originalUrl || req.url, apiKey, status);
        next();
    };
}

module.exports = {
    appendAuditEvent,
    createAuditLogger,
    hashApiKey,
    getLogFilePath
};
