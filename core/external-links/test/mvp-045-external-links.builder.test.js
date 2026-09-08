'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('MVP-045 External Links Builder', () => {
    const reportPath = path.join(process.cwd(), 'public', 'external-links-report.json');

    test('Genera public/external-links-report.json', () => {
        execSync('node scripts/build-external-links-report.js', { stdio: 'inherit' });
        expect(fs.existsSync(reportPath)).toBe(true);
    });

    test('El reporte tiene estado OK', () => {
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        expect(report.status).toBe('OK');
    });

    test('El reporte incluye array de items', () => {
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        expect(Array.isArray(report.items)).toBe(true);
    });

    test('Todos los items tienen url, statusCode y status', () => {
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        for (const item of report.items) {
            expect(item.url).toBeTruthy();
            expect(item).toHaveProperty('statusCode');
            expect(item.status).toMatch(/^(OK|ERROR|TIMEOUT)$/);
        }
    });
});
