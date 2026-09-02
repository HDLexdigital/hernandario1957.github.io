/**
 * E26.1 — Certification Record Contract Suite
 * 
 * Fase: GOVERNANCE / IMPLEMENTATION
 * 
 * Contrato de Emisión de Constancias de Certificación (Certification Record):
 * - C1. CERTIFICATION EVIDENCE REQUIRED: Rechaza emitir constancia si la evidencia Golden no está PRODUCTION_CERTIFIED.
 * - C2. IDENTITY BINDING: Vincula inequívocamente jobIdentity y executionId.
 * - C3. EVIDENCE BINDING: Preserva referencias a identidades criptográficas (AST, Plan, Artifact, Provenance).
 * - C4 & C8. DETERMINISTIC & REPLAY HASH: certificationHash es determinista e inmune a metadatos de runtime o desorden de claves.
 * - C5 & C7. DEFENSIVE IMMUTABILITY: El registro emite copias defensivas congeladas, previniendo mutaciones externas.
 * - C6. NO PARTIAL CERTIFICATION: Ausencia o corrupción de evidencia rechaza el registro de inmediato.
 */

'use strict';

const CertificationRecordEngine = require('../../../src/validadores/E26/CertificationRecordEngine');

describe('E26.1 — Certification Record Contract', () => {

    let validGoldenEvidence;

    beforeEach(() => {
        validGoldenEvidence = {
            status: 'PRODUCTION_CERTIFIED',
            corpusIdentity: 'CORPUS_CONSTITUCION_1991',
            jobIdentity: 'JOB_RELEASE_999',
            executionId: 'EXEC_999_A',
            artifactId: 'ARTIFACT_INDD_EPUB_01',
            provenanceIdentity: 'HASH_PROVENANCE_ROOT_01',
            astIdentity: 'AST_HASH_01',
            projectionPlanIdentity: 'PLAN_HASH_01',
            timestamp: '2026-08-22T00:00:00.000Z', // Metadato temporal que debe aislarse del hash
            runtimeTelemetry: { cpuTimeMs: 145 }        // Telemetría que debe ignorarse en el hash
        };
    });

    test('C1 & C3. EVIDENCE REQUIRED & BINDING: Emite constancia vinculando la evidencia válida', () => {
        const record = CertificationRecordEngine.createRecord(validGoldenEvidence);

        expect(record).toBeDefined();
        expect(record.status).toBe('PRODUCTION_CERTIFIED');
        expect(record.jobIdentity).toBe('JOB_RELEASE_999');
        expect(record.executionId).toBe('EXEC_999_A');
        expect(record.evidenceReferences.artifactId).toBe('ARTIFACT_INDD_EPUB_01');
    });

    test('C1 & C6. NO PARTIAL / INVALID EVIDENCE: Rechaza emitir registro si no está PRODUCTION_CERTIFIED', () => {
        const invalidEvidence = { ...validGoldenEvidence, status: 'ROUND_TRIP_FAILED' };

        const result = CertificationRecordEngine.createRecord(invalidEvidence);

        expect(result.status).toBe('CERTIFICATION_REJECTED');
        expect(result.reason).toBe('INVALID_GOLDEN_EVIDENCE');
    });

    test('C4 & C8. DETERMINISTIC HASH & REPLAY: El hash ignora timestamps y telemetría de runtime', () => {
        const evidenceVariant1 = { ...validGoldenEvidence, timestamp: '2026-08-22T00:00:00.000Z', runtimeTelemetry: { cpuTimeMs: 100 } };
        const evidenceVariant2 = { ...validGoldenEvidence, timestamp: '2026-08-22T12:34:56.000Z', runtimeTelemetry: { cpuTimeMs: 999 } };

        const record1 = CertificationRecordEngine.createRecord(evidenceVariant1);
        const record2 = CertificationRecordEngine.createRecord(evidenceVariant2);

        // Mide que el hash canónico sea estrictamente idéntico pese a la variación temporal y de telemetría
        expect(record1.certificationHash).toBe(record2.certificationHash);
    });

    test('C5 & C7. DEFENSIVE IMMUTABILITY: Previene modificaciones externas al objeto de registro', () => {
        const record = CertificationRecordEngine.createRecord(validGoldenEvidence);

        // Intento de mutación externa
        expect(() => {
            record.status = 'REVOKED';
        }).toThrow(); // O el objeto está congelado (Object.freeze)

        expect(record.status).toBe('PRODUCTION_CERTIFIED');
    });
});