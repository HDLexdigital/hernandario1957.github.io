/**
 * E24.3.4 — Failure Recovery Integration Contract Suite
 * 
 * Fase: VERDE / IMPLEMENTATION
 * 
 * Contrato de Integración de Recuperación ante Fallos:
 * - 1. SUCCESSFUL RECOVERY: Ejecuta ordenadamente rollback → quarantine → estado terminal QUARANTINED.
 * - 2. NO_PARTIAL_COMMIT: Garantiza que la política jamás autorice commits al maestro ante fallos.
 * - 3. IDENTITY SEPARATION: Verifica que el jobIdentity permanezca estable mientras el executionId aísla el intento.
 * - 4. DETERMINISTIC QUARANTINE: Demuestra que la misma evidencia produce idéntico canonicalHash.
 * - 5. ROLLBACK FAILURE: Ante un fallo de rollback, entra en estado terminal FAILED sin cuarentena espuria.
 * - 6. IDEMPOTENT RECOVERY: Comprueba que repetir el proceso de recuperación no corrompe ni duplica evidencia.
 */

'use strict';

const FailureRecoveryOrchestrator = require('../../../src/validadores/E24/FailureRecoveryOrchestrator');

describe('E24.3.4 — Failure Recovery Integration Contract', () => {

    const mockJob = Object.freeze({
        jobContractVersion: 'E24.1.0',
        identity: { jobId: 'JOB-2026-000001', jobVersion: '1.0.0', createdBy: 'LexDigitalHD' },
        source: { stage: 'E21', artifact: 'e21-derived-tree.json', sha256: 'abc' },
        projection: { stage: 'E23.3.2', artifact: 'e23-projection-plan.json', projectionVersion: 'E23.3.1', sha256: 'def' },
        target: { type: 'INDESIGN', profile: 'LEXDIGITAL-LEGAL-2026' },
        policy: {
            executionMode: 'LIVE',
            transactionPolicy: 'NO_PARTIAL_COMMIT',
            failurePolicy: 'QUARANTINE',
            retryPolicy: 'REPLAY_ONLY'
        },
        expected: { nodeCount: 87, operationCount: 87, unknownIds: 0, orphanNodes: 0, duplicateNodes: 0 },
        provenance: { pipelineVersion: 'LexDigitalHD', parentStages: ['E21'] }
    });

    const mockFailureContext = Object.freeze({
        executionId: 'EXEC_ATTEMPT_001',
        attempt: 1,
        status: 'EXECUTION_FAILED',
        errors: ['PHYSICAL_EXECUTION_VIOLATION: NO_PARTIAL_COMMIT - Nodo 43 falló.'],
        artifacts: [
            { artifactId: 'e21-derived-tree.json', artifactType: 'SOURCE_AST', sha256: 'abc', size: 1000 }
        ],
        evidence: {
            ledgerHash: 'ledger_abc',
            sourceArtifactHash: 'source_abc',
            projectionArtifactHash: 'proj_def',
            roundTripArtifactHash: 'rt_ghi'
        }
    });

    test('1. SUCCESSFUL RECOVERY: Orquesta correctamente el rollback, el aislamiento y el registro de cuarentena', () => {
        const result = FailureRecoveryOrchestrator.recover(mockJob, mockFailureContext);

        expect(result).toBeDefined();
        expect(result.terminalState).toBe('QUARANTINED');
        expect(result.workspaceDisposition).toBe('ROLLED_BACK');
        expect(result.quarantineRecord).toBeDefined();
        expect(result.quarantineRecord.canonicalHash).toHaveLength(64);
    });

    test('2. NO PARTIAL COMMIT: Asegura que la recuperación jamás autorice compromisos hacia el maestro', () => {
        const result = FailureRecoveryOrchestrator.recover(mockJob, mockFailureContext);

        expect(result.transactionCommitted).toBe(false);
        expect(result.masterWorkspaceTouched).toBe(false);
    });

    test('3. IDENTITY SEPARATION: Preserva el jobIdentity inmutable y aísla la ejecución mediante executionId', () => {
        const result = FailureRecoveryOrchestrator.recover(mockJob, mockFailureContext);

        expect(result.executionId).toBe(mockFailureContext.executionId);
        expect(result.jobIdentity).toBeDefined();
        expect(result.jobIdentity.length).toBe(64); // SHA-256 del job canónico
    });

    test('4. DETERMINISTIC QUARANTINE: Mismo contexto de fallo produce idéntico canonicalHash forense', () => {
        const result1 = FailureRecoveryOrchestrator.recover(mockJob, mockFailureContext);
        const result2 = FailureRecoveryOrchestrator.recover(mockJob, mockFailureContext);

        expect(result1.quarantineRecord.canonicalHash).toBe(result2.quarantineRecord.canonicalHash);
    });

    test('5. ROLLBACK FAILURE: Si el rollback del workspace falla, entra en estado terminal FAILED sin emitir cuarentena falsa', () => {
        const faultyContext = {
            ...mockFailureContext,
            forceRollbackFailure: true // Inyección controlada de fallo en workspace
        };

        const result = FailureRecoveryOrchestrator.recover(mockJob, faultyContext);

        expect(result.terminalState).toBe('FAILED');
        expect(result.quarantineRecord).toBeNull();
        expect(result.errors).toContainEqual(expect.stringMatching(/ROLLBACK_FAILURE/));
    });

    test('6. IDEMPOTENT RECOVERY: Procesar el segundo intento del mismo fallo no muta la evidencia canónica', () => {
        const result1 = FailureRecoveryOrchestrator.recover(mockJob, mockFailureContext);
        const result2 = FailureRecoveryOrchestrator.recover(mockJob, mockFailureContext);

        expect(result1.quarantineRecord).toEqual(result2.quarantineRecord);
    });

});