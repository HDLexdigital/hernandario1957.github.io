'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('MVP-042 Integrity Builder', () => {
    const reportPath = path.join(process.cwd(), 'public', 'integrity-report.json');

    test('Genera public/integrity-report.json', () => {
        execSync('node scripts/build-integrity-report.js');
        expect(fs.existsSync(reportPath)).toBe(true);
    });

    test('El reporte tiene estado OK', () => {
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        expect(report.status).toBe('OK');
    });

    test('El reporte incluye artefactos', () => {
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        expect(Array.isArray(report.artifacts)).toBe(true);
        expect(report.artifacts.length).toBeGreaterThan(0);
    });

    test('No hay roturas detectadas', () => {
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        const broken = report.artifacts.filter(a => !a.exists);
        expect(broken).toHaveLength(0);
    });
});
