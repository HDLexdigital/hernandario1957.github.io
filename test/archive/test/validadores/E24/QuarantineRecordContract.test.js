/**
 * E24.3.3 — Quarantine Record & Forensic Package Contract Suite
 * 
 * Fase: RED / IMPLEMENTATION
 * 
 * Contrato de Registro de Cuarentena y Paquete Forense:
 * - Valida el esquema normativo y el vocabulario cerrado de clases de fallo (`failureClass`).
 * - Vincula de forma inequívoca el `jobIdentity` (E24.2) con el `executionId` y el intento.
 * - Garantiza el determinismo en el cálculo del `canonicalHash`, excluyendo explícitamente la telemetría volátil de runtime.
 * - Previene la dependencia circular asegurando que el hash se calcule sobre el payload limpio sin incluirse a sí mismo.
 * - Sella la inmutabilidad y el carácter append-only del registro forense.
 */

'use strict';

// El motor de registros de cuarentena aún no está implementado (Fase RED esperada)
const QuarantineRecordEngine = require('../../../src/validadores/E24/QuarantineRecordEngine');

describe('E24.3.3 — Quarantine Record & Forensic Package Contract (Fase RED)', () => {

    const baseFailureIncident = Object.freeze({
        jobIdentity: 'ABC123SHA256JOBIDENTITY',
        executionId: 'EXEC_ATTEMPT_001',
        attempt: 1,
        failure: {
            failureClass: 'ROUNDTRIP_FAILURE',
            code: 'ROUND_TRIP_VIOLATION: CONTENT_DRIFT',
            message: 'El contenido textual del nodo no coincide con el baseline.',
            stage: 'E23.3.5.4'
        },
        recovery: {
            decision: 'QUARANTINE',
            policy: 'NO_PARTIAL_COMMIT'
        },
        workspace: {
            disposition: 'ROLLED_BACK'
        },
        artifacts: [
            {
                artifactId: 'e21-derived-tree.json',
                artifactType: 'SOURCE_AST',
                sha256: 'a1b2c3d4...',
                size: 10450
            }
        ],
        evidence: {
            ledgerHash: 'ledger_hash_xyz',
            sourceArtifactHash: 'source_hash_abc',
            projectionArtifactHash: 'proj_hash_def',
            roundTripArtifactHash: 'rt_hash_ghi'
        }
    });

    test('1. QUARANTINE SCHEMA VALID: Valida exitosamente un incidente forense bien formado con vocabulario cerrado', () => {
        const record = QuarantineRecordEngine.createQuarantineRecord(baseFailureIncident);

        expect(record).toBeDefined();
        expect(record.quarantineVersion).toBe('E24.3.3');
        expect(record.status).toBe('QUARANTINED');
        expect(typeof record.canonicalHash).toBe('string');
        expect(record.canonicalHash.length).toBe(64); // SHA-256 hex
    });

    test('2. CLOSED FAILURE CLASS VOCABULARY: Rechaza clases de fallo no reconocidas por el contrato', () => {
        const invalidIncident = JSON.parse(JSON.stringify(baseFailureIncident));
        invalidIncident.failure.failureClass = 'ERROR_INVENTADO_POR_SOPORTE';

        expect(() => {
            QuarantineRecordEngine.createQuarantineRecord(invalidIncident);
        }).toThrow(/QUARANTINE_VIOLATION:.*failureClass/);
    });

    test('3. DETERMINISTIC CANONICAL HASH: El mismo incidente produce idéntico hash canónico independientemente del orden de propiedades', () => {
        const shuffledIncident = {
            evidence: baseFailureIncident.evidence,
            artifacts: baseFailureIncident.artifacts,
            workspace: baseFailureIncident.workspace,
            recovery: baseFailureIncident.recovery,
            failure: baseFailureIncident.failure,
            attempt: baseFailureIncident.attempt,
            executionId: baseFailureIncident.executionId,
            jobIdentity: baseFailureIncident.jobIdentity
        };

        const record1 = QuarantineRecordEngine.createQuarantineRecord(baseFailureIncident);
        const record2 = QuarantineRecordEngine.createQuarantineRecord(shuffledIncident);

        expect(record1.canonicalHash).toBe(record2.canonicalHash);
    });

    test('4. RUNTIME TELEMETRY EXCLUSION: Agregar metadatos volátiles no altera el canonicalHash forense', () => {
        const incidentWithRuntime = {
            ...baseFailureIncident,
            runtimeTelemetry: {
                timestamp: '2026-08-21T20:00:00Z',
                pid: 14592,
                hostname: 'local-dev-machine'
            }
        };

        const cleanRecord = QuarantineRecordEngine.createQuarantineRecord(baseFailureIncident);
        const runtimeRecord = QuarantineRecordEngine.createQuarantineRecord(incidentWithRuntime);

        expect(runtimeRecord.canonicalHash).toBe(cleanRecord.canonicalHash);
    });

    test('5. FORENSIC IMMUTABILITY: El motor opera de forma pura sin mutar el objeto de incidente original', () => {
        const snapshotBefore = JSON.stringify(baseFailureIncident);
        QuarantineRecordEngine.createQuarantineRecord(baseFailureIncident);
        const snapshotAfter = JSON.stringify(baseFailureIncident);

        expect(snapshotAfter).toBe(snapshotBefore);
    });

});