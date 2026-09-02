/**
 * E24.2 — Canonical Job Identity & Replay Contract Suite
 * 
 * Fase: VERDE / IMPLEMENTACIÓN
 * 
 * Contrato de Identidad Canónica del Job:
 * - 1. Identidad básica: jobIdentity = SHA-256(canonicalJob).
 * - 2. Determinismo: Mismo EditorialJob produce idéntica identidad criptográfica.
 * - 3. Orden de claves: La permutación de propiedades JSON no altera la identidad canónica.
 * - 4. Sensibilidad semántica: Cualquier alteración en campos contractuales modifica el hash.
 * - 5. Exclusión de Runtime: Metadatos temporales o de telemetría no alteran la identidad.
 * - 6. Replay: Permite verificar la fidelidad de un job histórico frente a su identidad almacenada.
 * - 7. Inmutabilidad: Las funciones operan de forma pura sin mutar el objeto original.
 */

'use strict';

const CanonicalJobIdentityEngine = require('../../../src/validadores/E24/CanonicalJobIdentityEngine');

describe('E24.2 — Canonical Job Identity & Replay Contract', () => {

    const baseJobMock = Object.freeze({
        jobContractVersion: 'E24.1.0',
        identity: {
            jobId: 'JOB-2026-000001',
            jobVersion: '1.0.0',
            createdBy: 'LexDigitalHD'
        },
        source: {
            stage: 'E21',
            artifact: 'e21-derived-tree.json',
            sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
        },
        projection: {
            stage: 'E23.3.2',
            artifact: 'e23-projection-plan.json',
            projectionVersion: 'E23.3.1',
            sha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'
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

    test('1 & 2. BASIC IDENTITY & DETERMINISM: Genera un hash SHA-256 determinista a partir del job canónico', () => {
        const result1 = CanonicalJobIdentityEngine.computeIdentity(baseJobMock);
        const result2 = CanonicalJobIdentityEngine.computeIdentity(baseJobMock);

        expect(result1).toBeDefined();
        expect(typeof result1.jobIdentity).toBe('string');
        expect(result1.jobIdentity.length).toBe(64); // Longitud estándar SHA-256 hex
        expect(result1.jobIdentity).toBe(result2.jobIdentity);
    });

    test('3. KEY ORDER INDEPENDENCE: La permutación del orden de las claves JSON no altera la identidad', () => {
        // Reconstruimos el objeto con desorden deliberado de propiedades
        const shuffledJob = {
            provenance: baseJobMock.provenance,
            target: baseJobMock.target,
            jobContractVersion: baseJobMock.jobContractVersion,
            policy: baseJobMock.policy,
            expected: baseJobMock.expected,
            source: baseJobMock.source,
            projection: baseJobMock.projection,
            identity: baseJobMock.identity
        };

        const originalIdentity = CanonicalJobIdentityEngine.computeIdentity(baseJobMock).jobIdentity;
        const shuffledIdentity = CanonicalJobIdentityEngine.computeIdentity(shuffledJob).jobIdentity;

        expect(shuffledIdentity).toBe(originalIdentity);
    });

    test('4. SEMANTIC SENSITIVITY: Modificar un campo contractual altera de inmediato la identidad', () => {
        const modifiedJob = JSON.parse(JSON.stringify(baseJobMock));
        modifiedJob.expected.nodeCount = 86; // Cambio semántico

        const originalIdentity = CanonicalJobIdentityEngine.computeIdentity(baseJobMock).jobIdentity;
        const modifiedIdentity = CanonicalJobIdentityEngine.computeIdentity(modifiedJob).jobIdentity;

        expect(modifiedIdentity).not.toBe(originalIdentity);
    });

    test('5. RUNTIME EXCLUSION: Agregar metadatos temporales o de runtime NO modifica la identidad canónica', () => {
        const jobWithRuntime = {
            ...baseJobMock,
            runtimeTelemetry: {
                timestamp: '2026-08-21T18:00:00Z',
                executionDurationMs: 1420,
                sessionId: 'UXP_SESSION_XYZ',
                hostname: 'production-runner-01'
            }
        };

        const originalIdentity = CanonicalJobIdentityEngine.computeIdentity(baseJobMock).jobIdentity;
        const runtimeIdentity = CanonicalJobIdentityEngine.computeIdentity(jobWithRuntime).jobIdentity;

        expect(runtimeIdentity).toBe(originalIdentity);
    });

    test('6. REPLAY VERIFICATION: Verifica con éxito que la identidad almacenada coincide con la recalculada', () => {
        const computed = CanonicalJobIdentityEngine.computeIdentity(baseJobMock);
        
        const verification = CanonicalJobIdentityEngine.verifyReplay(baseJobMock, computed.jobIdentity);

        expect(verification.valid).toBe(true);
        expect(verification.storedIdentity).toBe(computed.jobIdentity);
        expect(verification.recomputedIdentity).toBe(computed.jobIdentity);
    });

    test('7. IMMUTABILITY: Las funciones operan de forma pura sin mutar el EditorialJob original', () => {
        const snapshotBefore = JSON.stringify(baseJobMock);
        
        CanonicalJobIdentityEngine.computeIdentity(baseJobMock);
        CanonicalJobIdentityEngine.canonicalize(baseJobMock);

        const snapshotAfter = JSON.stringify(baseJobMock);
        expect(snapshotAfter).toBe(snapshotBefore);
    });

});