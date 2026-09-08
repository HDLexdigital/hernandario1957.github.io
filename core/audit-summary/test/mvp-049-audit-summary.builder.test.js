'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('MVP-049 Audit Summary Builder', () => {
    const summaryPath = path.join(process.cwd(), 'public', 'audit-summary.json');

    test('Genera public/audit-summary.json', () => {
        execSync('node scripts/build-audit-summary.js');
        expect(fs.existsSync(summaryPath)).toBe(true);
    });

    test('El resumen tiene estado OK', () => {
        const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
        expect(summary.status).toBe('OK');
    });

    test('El resumen incluye reports', () => {
        const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
        expect(summary.reports).toBeTruthy();
        expect(summary.reports.integrity).toBeTruthy();
        expect(summary.reports.externalLinks).toBeTruthy();
        expect(summary.reports.anchors).toBeTruthy();
    });

    test('El resumen incluye counts', () => {
        const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
        expect(summary.counts).toBeTruthy();
        expect(summary.counts.integrityErrors).toBe(0);
        expect(summary.counts.externalLinksErrors).toBe(0);
        expect(summary.counts.anchorsErrors).toBe(0);
    });
});
