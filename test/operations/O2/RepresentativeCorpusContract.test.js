/**
 * O2.2 — Representative Corpus Contract Suite (R1–R10)
 */

'use strict';

const path = require('path');
const fs = require('fs');
const O22RepresentativeRunner = require(path.join(process.cwd(), 'src', 'operations', 'O2', 'O22RepresentativeRunner'));
const representativeCorpus = require(path.join(process.cwd(), 'src', 'operations', 'O2', 'fixtures', 'representativeJuridicalCorpus.json'));

describe('O2.2 — Representative Corpus Contract Suite', () => {

    const sandboxDir = path.join(process.cwd(), 'test-o22-sandbox');
    let runner;

    beforeEach(() => {
        if (fs.existsSync(sandboxDir)) {
            fs.rmSync(sandboxDir, { recursive: true, force: true });
        }
        const EvidencePersistenceEngine = require(path.join(process.cwd(), 'src', 'operations', 'O1', 'EvidencePersistenceEngine'));
        const persistence = new EvidencePersistenceEngine(sandboxDir);
        runner = new O22RepresentativeRunner(persistence);
    });

    afterEach(() => {
        if (fs.existsSync(sandboxDir)) {
            fs.chmodSync(sandboxDir, 0o777);
            fs.rmSync(sandboxDir, { recursive: true, force: true });
        }
    });

    test('R1–R7, R9 & R10. CAMINO VERDE REPRESENTATIVO: Valida tablas, notas y accesibilidad alcanzando PRODUCTION', () => {
        const result = runner.runRepresentativeRun(representativeCorpus, { authorizeRelease: true });

        expect(result.status).toBe('SUCCESS');
        expect(result.terminalState).toBe('PRODUCTION');
        expect(result.productionCorpusCertificate.representativeVerification.tablesVerified).toBe(true);
        expect(result.productionCorpusCertificate.representativeVerification.accessibilityValidated).toBe(true);
        expect(result.inputHash).toBeDefined();
    });

    test('R8. FAILURE ISOLATION: Corrupción de tabla o estructura compleja deriva inmediatamente a QUARANTINED', () => {
        const result = runner.runRepresentativeRun(representativeCorpus, { simulateTableCorruption: true });

        expect(result.status).toBe('FAILED');
        expect(result.terminalState).toBe('QUARANTINED');
        expect(result.reason).toBe('TABLE_INTEGRITY_VIOLATION');
    });
});