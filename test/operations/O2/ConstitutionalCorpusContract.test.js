/**
 * O2.3 — Constitutional Corpus Contract Suite (C1–C12)
 */

'use strict';

const path = require('path');
const fs = require('fs');
const O23ConstitutionalRunner = require(path.join(process.cwd(), 'src', 'operations', 'O2', 'O23ConstitutionalRunner'));
const constitutionalCorpus = require(path.join(process.cwd(), 'src', 'operations', 'O2', 'fixtures', 'constitucionPoliticaColombiaCorpus.json'));

describe('O2.3 — Constitutional Corpus Contract Suite', () => {

    const sandboxDir = path.join(process.cwd(), 'test-o23-sandbox');
    let runner;

    beforeEach(() => {
        if (fs.existsSync(sandboxDir)) {
            fs.rmSync(sandboxDir, { recursive: true, force: true });
        }
        const EvidencePersistenceEngine = require(path.join(process.cwd(), 'src', 'operations', 'O1', 'EvidencePersistenceEngine'));
        const persistence = new EvidencePersistenceEngine(sandboxDir);
        runner = new O23ConstitutionalRunner(persistence);
    });

    // Reemplaza el bloque afterEach por esto:
	afterEach(() => {
		if (fs.existsSync(sandboxDir)) {
			fs.rmSync(sandboxDir, { recursive: true, force: true });
		}
});
    test('C1–C11. CAMINO VERDE INSTITUCIONAL: Ingiere, verifica cardinalidad y certifica la Constitución completa hacia PRODUCTION', () => {
        const result = runner.runConstitutionalRun(constitutionalCorpus, { authorizeRelease: true });

        expect(result.status).toBe('SUCCESS');
        expect(result.terminalState).toBe('PRODUCTION');
        expect(result.productionCorpusCertificate.institutionalVerification.completenessVerified).toBe(true);
        expect(result.productionCorpusCertificate.institutionalVerification.cardinalityMatched).toBe(true);
        expect(result.inputHash).toBeDefined();
    });

    test('C2 & C12. FAILURE CONTAINMENT (INCOMPLETITUD): Detecta falta de nodos y confina a QUARANTINED', () => {
        const result = runner.runConstitutionalRun(constitutionalCorpus, { simulateMissingNodes: true });

        expect(result.status).toBe('FAILED');
        expect(result.terminalState).toBe('QUARANTINED');
        expect(result.reason).toBe('CORPUS_COMPLETENESS_VIOLATION_MISSING_NODES');
    });

    test('C3 & C12. FAILURE CONTAINMENT (DIVERGENCIA DE CARDINALIDAD): Invalida la ejecución ante desajustes estructurales', () => {
        const result = runner.runConstitutionalRun(constitutionalCorpus, { forceCorpusDivergence: true });

        expect(result.status).toBe('FAILED');
        expect(result.terminalState).toBe('QUARANTINED');
        expect(result.reason).toBe('STRUCTURAL_CARDINALITY_MISMATCH');
    });
});