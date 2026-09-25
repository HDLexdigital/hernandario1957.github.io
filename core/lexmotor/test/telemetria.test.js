/**
 * test/telemetria.test.js
 * Pruebas del subsistema de persistencia histórica C01-OBS
 */
const { persistirReporteBatch } = require('../../../src/telemetria/persistenciaBatch.js');
const fs = require('fs');
const path = require('path');

describe('C01-OBS Persistencia Histórica', () => {
    const testReportDir = path.join(__dirname, '../../../test/fixtures/reportes-test');

    afterEach(() => {
        if (fs.existsSync(testReportDir)) {
            fs.rmSync(testReportDir, { recursive: true, force: true });
        }
    });

    test('Persiste el reporte en una ruta cronológica YYYY-MM-DD sin sobrescribir', () => {
        const reporteMock = {
            batchId: '2026-09-23T12:00:00.000Z',
            profile: 'WEB',
            processed: 5,
            succeeded: 5,
            failed: 0,
            errors: {},
            durationMs: 150,
            documents: []
        };

        const ruta1 = persistirReporteBatch(reporteMock, testReportDir);
        const ruta2 = persistirReporteBatch(reporteMock, testReportDir);

        expect(ruta1).toContain('2026-09-23');
        expect(fs.existsSync(ruta1)).toBe(true);

        // Valida la regla OBS-INV-01 (no sobrescritura)
        expect(ruta1).not.toBe(ruta2);
        expect(fs.existsSync(ruta2)).toBe(true);
    });
});
