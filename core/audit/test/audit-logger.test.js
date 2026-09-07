'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { appendAuditEvent, hashApiKey, getLogFilePath } = require('../audit-logger');

describe('MVP-018 Audit Logger', () => {
    let tmpDir;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mvp018-audit-'));
        process.env.AUDIT_LOG_DIR = tmpDir;
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        delete process.env.AUDIT_LOG_DIR;
    });

    test('appendAuditEvent crea archivo JSONL en el directorio temporal', () => {
        const entry = appendAuditEvent('request', '/api/v1/status', 'test-key', 'authorized');
        expect(entry).toBeDefined();
        expect(entry.apiKeyHash).not.toBe('test-key');
        expect(entry.apiKeyHash).toMatch(/^[a-f0-9]{16}$/);

        const logFile = getLogFilePath();
        expect(fs.existsSync(logFile)).toBe(true);

        const lines = fs.readFileSync(logFile, 'utf8').trim().split(/\r?\n/).filter(Boolean);
        expect(lines.length).toBe(1);

        const parsed = JSON.parse(lines[0]);
        expect(parsed.event).toBe('request');
        expect(parsed.resource).toBe('/api/v1/status');
        expect(parsed.status).toBe('authorized');
    });

    test('hashApiKey no revela la clave original', () => {
        const hash = hashApiKey('super-secret');
        expect(hash).not.toContain('super-secret');
        expect(hash).toHaveLength(16);
    });

    test('appendAuditEvent no incluye datos personales', () => {
        const entry = appendAuditEvent('search', '/api/v1/search?q=test', 'key', 'authorized');
        expect(entry).not.toHaveProperty('user');
        expect(entry).not.toHaveProperty('email');
        expect(entry).not.toHaveProperty('ip');
    });
});
