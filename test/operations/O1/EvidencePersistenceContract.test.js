/**
 * O1.1 — Evidence Persistence Contract Suite
 * 
 * Valida los 6 invariantes de la capa de persistencia de evidencia soberana:
 * - O1.1-A: Canonical Path Identity
 * - O1.1-B: Deterministic Serialization
 * - O1.1-C: Atomic Persistence
 * - O1.1-D: Integrity Seal
 * - O1.1-E: Immutable Evidence
 * - O1.1-F: Execution Isolation
 */

'use strict';

const fs = require('fs');
// Reemplaza la línea 17 por esto:
const path = require('path');
const EvidencePersistenceEngine = require(path.join(process.cwd(), 'src', 'operations', 'O1', 'EvidencePersistenceEngine'));

describe('O1.1 — Evidence Persistence Layer Contract', () => {

    const testStorageDir = path.join(process.cwd(), 'test-evidence-sandbox');
    let engine;

    beforeEach(() => {
        if (fs.existsSync(testStorageDir)) {
            // Limpieza recursiva controlada para pruebas (eliminando readonly temporalmente si aplica)
            fs.rmSync(testStorageDir, { recursive: true, force: true });
        }
        engine = new EvidencePersistenceEngine(testStorageDir);
    });

    afterEach(() => {
        if (fs.existsSync(testStorageDir)) {
            fs.chmodSync(testStorageDir, 0o777);
            fs.rmSync(testStorageDir, { recursive: true, force: true });
        }
    });

    test('O1.1-A & O1.1-B. CANONICAL PATH & DETERMINISTIC SERIALIZATION: Normaliza rutas y serializa de forma estable', () => {
        const pathWin = 'C:\\LexDigitalHD\\Corpus\\Const_2026.json';
        const normalized = EvidencePersistenceEngine.normalizeCanonicalPath(pathWin);
        expect(normalized).toBe('LexDigitalHD/Corpus/Const_2026.json');

        const objA = { z: 1, a: 2 };
        const objB = { a: 2, z: 1 };
        expect(EvidencePersistenceEngine.canonicalizePayload(objA)).toBe(EvidencePersistenceEngine.canonicalizePayload(objB));
    });

    test('O1.1-C, O1.1-D & O1.1-F. ATOMIC PERSISTENCE, INTEGRITY & ISOLATION: Sella evidencia aislada con integridad', () => {
        const job = 'JOB_TEST_01';
        const execA = 'EXEC_AAA';
        const execB = 'EXEC_BBB';

        const resultA = engine.persistEvidence(job, execA, 'governance', 'certification-record', { status: 'APPROVED' });
        const resultB = engine.persistEvidence(job, execB, 'governance', 'certification-record', { status: 'APPROVED' });

        expect(resultA.status).toBe('EVIDENCE_SEALED');
        expect(resultA.evidenceHash).toBeDefined();
        expect(resultA.targetPath).not.toBe(resultB.targetPath);
    });

    test('O1.1-E. IMMUTABLE EVIDENCE: Rechaza estrictamente la sobrescritura de evidencia ya sellada', () => {
        const job = 'JOB_IMMUTABLE';
        const exec = 'EXEC_01';

        engine.persistEvidence(job, exec, 'identities', 'input', { version: 1 });

        // Intentar sobrescribir la misma evidencia debe lanzar error de inmutabilidad
        expect(() => {
            engine.persistEvidence(job, exec, 'identities', 'input', { version: 2 });
        }).toThrow('IMMUTABLE_EVIDENCE_VIOLATION');
    });
});