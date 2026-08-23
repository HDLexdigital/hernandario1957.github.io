/**
 * O3.3 — Forensic Audit & Reconstruction Contract Suite (F1–F12)
 */

'use strict';

const path = require('path');
const ExecutionRegistryEngine = require(path.join(process.cwd(), 'src', 'operations', 'O3', 'ExecutionRegistryEngine'));
const ExecutionEventLedgerEngine = require(path.join(process.cwd(), 'src', 'operations', 'O3', 'ExecutionEventLedgerEngine'));
const ForensicAuditEngine = require(path.join(process.cwd(), 'src', 'operations', 'O3', 'ForensicAuditEngine'));

describe('O3.3 — Forensic Audit & Reconstruction Contract Suite (F1–F12)', () => {

    let registry;
    let engine;
    const sampleExecutionId = 'EXEC_FORENSIC_001';
    const sampleJobIdentity = 'JOB_AUDIT_TEST';

    beforeEach(() => {
        registry = new ExecutionRegistryEngine();
        engine = new ForensicAuditEngine(registry);
    });

    function createValidFixture() {
        registry.registerExecution({
            executionId: sampleExecutionId,
            jobIdentity: sampleJobIdentity,
            status: 'PRODUCTION'
        });

        const ledger = new ExecutionEventLedgerEngine(sampleExecutionId);
        ledger.appendEvent('CREATED');
        ledger.appendEvent('VALIDATED');
        ledger.appendEvent('PRODUCTION');

        const evidenceManifest = {
            executionId: sampleExecutionId,
            inputHash: 'sha256_input_mock',
            provenanceTrace: ['input', 'ast', 'plan', 'render', 'certification']
        };

        return { ledger, evidenceManifest };
    }

    test('F1–F10. CAMINO VERDE FORENSE: Reconstruye y valida una ejecución íntegra end-to-end', () => {
        const fixture = createValidFixture();
        const auditResult = engine.auditExecution(sampleExecutionId, fixture.ledger, fixture.evidenceManifest);

        expect(auditResult.verdict).toBe('FORENSICALLY_VALID');
        expect(auditResult.registryStatus).toBe('RESOLVED');
        expect(auditResult.ledgerStatus).toBe('VALID');
        expect(auditResult.evidenceStatus).toBe('RESOLVED');
        expect(auditResult.violations.length).toBe(0);
        expect(auditResult.verdictHash).toBeDefined();
    });

    test('F11. READ-ONLY AUDIT: La auditoría no altera ninguna evidencia ni estructura analizada', () => {
        const fixture = createValidFixture();
        
        // Toma instantáneas previas
        const registryBefore = JSON.stringify(registry.lookup(sampleExecutionId));
        const ledgerBefore = JSON.stringify(fixture.ledger.getLedgerSnapshot());
        const evidenceBefore = JSON.stringify(fixture.evidenceManifest);

        // Ejecuta auditoría forense
        engine.auditExecution(sampleExecutionId, fixture.ledger, fixture.evidenceManifest);

        // Toma instantáneas posteriores
        const registryAfter = JSON.stringify(registry.lookup(sampleExecutionId));
        const ledgerAfter = JSON.stringify(fixture.ledger.getLedgerSnapshot());
        const evidenceAfter = JSON.stringify(fixture.evidenceManifest);

        expect(registryAfter).toBe(registryBefore);
        expect(ledgerAfter).toBe(ledgerBefore);
        expect(evidenceAfter).toBe(evidenceBefore);
    });

    test('F12. DETERMINISTIC VERDICT: Dos auditorías independientes sobre la misma evidencia producen exactamente el mismo verdictHash', () => {
        const fixture = createValidFixture();

        const auditA = engine.auditExecution(sampleExecutionId, fixture.ledger, fixture.evidenceManifest);
        const auditB = engine.auditExecution(sampleExecutionId, fixture.ledger, fixture.evidenceManifest);

        expect(auditA.verdictHash).toBe(auditB.verdictHash);
        expect(auditA.verdict).toBe(auditB.verdict);
    });

    test('F1. EXECUTION ADDRESSABILITY: Detecta executionId inexistente en el Registry', () => {
        const fixture = createValidFixture();
        const auditResult = engine.auditExecution('EXEC_UNKNOWN_999', fixture.ledger, fixture.evidenceManifest);

        expect(auditResult.verdict).toBe('FORENSICALLY_INCOMPLETE');
        expect(auditResult.violations.some(v => v.code === 'EXECUTION_NOT_FOUND')).toBe(true);
    });
});