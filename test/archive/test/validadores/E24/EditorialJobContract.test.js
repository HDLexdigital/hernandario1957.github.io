/**
 * E24.1 — Production Editorial Job Contract Suite
 * 
 * Fase: RED
 * 
 * Contrato del Job de Producción Editorial:
 * - Valida la estructura canónica y la presencia obligatoria de identidad, source, projection, target, policy y expected.
 * - Exige verificación criptográfica SHA-256 para el source y el plan de proyección (rechaza desvíos).
 * - Aplica los candados de masa e invariantes esperados (87 nodos, 0 unknown-ids, 0 huérfanos).
 * - Garantiza la inmutabilidad absoluta del job y el rechazo de políticas o transacciones no soportadas.
 */

'use strict';

// El validador de jobs de producción aún no está implementado (Fase RED esperada)
const EditorialJobValidator = require('../../../src/validadores/E24/EditorialJobValidator');

describe('E24.1 — Production Editorial Job Contract (Fase RED)', () => {

    const validJobMock = Object.freeze({
        jobContractVersion: 'E24.1.0',
        identity: {
            jobId: 'JOB-2026-000001',
            jobVersion: '1.0.0',
            createdBy: 'LexDigitalHD'
        },
        source: {
            stage: 'E21',
            artifact: 'e21-derived-tree.json',
            sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' // mock hash
        },
        projection: {
            stage: 'E23.3.2',
            artifact: 'e23-projection-plan.json',
            projectionVersion: 'E23.3.1',
            sha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0' // mock hash
        },
        target: {
            type: 'INDESIGN',
            profile: 'LEXDIGITAL-LEGAL-2026'
        },
        policy: {
            executionMode: 'LIVE',
            transactionPolicy: 'NO_PARTIAL_COMMIT',
            failurePolicy: 'QUARANTINE',
            retryPolicy: 'REPLAY_ONLY'
        },
        expected: {
            nodeCount: 87,
            operationCount: 87,
            unknownIds: 0,
            orphanNodes: 0,
            duplicateNodes: 0
        },
        provenance: {
            pipelineVersion: 'LexDigitalHD',
            parentStages: ['E18.4', 'E19.5', 'E20.7', 'E21', 'E22', 'E23.3.5.4']
        }
    });

    test('1. JOB SCHEMA VALID: Valida exitosamente un contrato de job completo y bien formado', () => {
        const validation = EditorialJobValidator.validateContract(validJobMock);

        expect(validation).toBeDefined();
        expect(validation.status).toBe('JOB_VALIDATED');
        expect(validation.jobId).toBe('JOB-2026-000001');
    });

    test('2. JOB ID REQUIRED: Falla de inmediato si el jobId está ausente o vacío', () => {
        const invalidJob = JSON.parse(JSON.stringify(validJobMock));
        invalidJob.identity.jobId = '';

        expect(() => {
            EditorialJobValidator.validateContract(invalidJob);
        }).toThrow(/EDITORIAL_JOB_VIOLATION:.*jobId/);
    });

    test('3. SOURCE INTEGRITY: Falla si el hash SHA-256 del source no coincide con la evidencia calculada del archivo real', () => {
        const invalidJob = JSON.parse(JSON.stringify(validJobMock));
        invalidJob.source.sha256 = 'BAD_HASH_FOR_TESTING';

        // Simulando verificación contra artefacto real cargado
        expect(() => {
            EditorialJobValidator.verifySourceIntegrity(invalidJob, { 'e21-derived-tree.json': 'DIFFERENT_CONTENT' });
        }).toThrow(/EDITORIAL_JOB_VIOLATION:.*SOURCE_HASH_MISMATCH/);
    });

    test('4. EXPECTED MASS LOCK: Falla si los nodos esperados no coinciden estrictamente con el contrato (ej. 86 en vez de 87)', () => {
        const invalidJob = JSON.parse(JSON.stringify(validJobMock));
        invalidJob.expected.nodeCount = 86; // Alteración de masa

        expect(() => {
            EditorialJobValidator.validateContract(invalidJob);
        }).toThrow(/EDITORIAL_JOB_VIOLATION:.*nodeCount/);
    });

    test('5. POLICY LOCK: Rechaza políticas de ejecución o transaccionales desconocidas o vulnerables', () => {
        const invalidJob = JSON.parse(JSON.stringify(validJobMock));
        invalidJob.policy.transactionPolicy = 'PARTIAL_COMMIT_ALLOWED'; // Prohibido por diseño

        expect(() => {
            EditorialJobValidator.validateContract(invalidJob);
        }).toThrow(/EDITORIAL_JOB_VIOLATION:.*transactionPolicy/);
    });

});