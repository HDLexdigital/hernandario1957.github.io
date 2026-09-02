/**
 * E26.4 — Release / Publication Gate Contract Suite
 * 
 * Fase: GOVERNANCE / IMPLEMENTATION
 * 
 * Contrato de Decisión y Puerta de Publicación (Release / Publication Gate):
 * - RG1 & RG3. CHAIN COMPLETENESS & TERMINAL STATES: Exige cadena completa y estados terminales CERTIFIED.
 * - RG2. IDENTITY CONSISTENCY: Bloquea de inmediato si hay desajustes de jobIdentity o hashes cruzados.
 * - RG4. NO ARTIFACT SUBSTITUTION: Detecta cualquier alteración o sustitución en el set de artefactos del manifiesto.
 * - RG5. EXPLICIT AUTHORIZATION: La excelencia técnica no basta; exige authorizationStatus = AUTHORIZED explícito.
 * - RG6 & RG8. DETERMINISTIC DECISION & HASH: Genera un releaseDecisionHash canónico inmune a timestamps o runtime.
 * - RG7. IMMUTABLE DECISION: Garantiza inmutabilidad defensiva total sobre el veredicto terminal.
 */

'use strict';

const ReleaseGateEngine = require('../../../src/validadores/E26/ReleaseGateEngine');

describe('E26.4 — Release / Publication Gate Contract', () => {

    let validRecord;
    let validManifest;
    let validMultiFormat;
    let validPolicy;

    beforeEach(() => {
        validRecord = {
            status: 'PRODUCTION_CERTIFIED',
            jobIdentity: 'JOB_RELEASE_999',
            certificationHash: 'CERT_HASH_01'
        };

        validManifest = {
            status: 'CERTIFIED',
            jobIdentity: 'JOB_RELEASE_999',
            manifestHash: 'MANIFEST_HASH_01',
            artifacts: [
                { artifactId: 'ART_INDD', contentHash: 'HASH_I' },
                { artifactId: 'ART_PDF', contentHash: 'HASH_P' }
            ]
        };

        validMultiFormat = {
            status: 'MULTI_FORMAT_CERTIFIED',
            manifestHash: 'MANIFEST_HASH_01',
            multiFormatCertificationHash: 'MF_HASH_01'
        };

        validPolicy = {
            releasePolicyIdentity: 'POLICY_STANDARD_01',
            authorizationStatus: 'AUTHORIZED'
        };
    });

    test('RG1, RG3 & RG5. AUTHORIZED CHAIN: Autoriza el release ante cadena completa, estados terminales y autorización explícita', () => {
        const decision = ReleaseGateEngine.evaluateRelease(validRecord, validManifest, validMultiFormat, validPolicy);

        expect(decision.status).toBe('RELEASE_AUTHORIZED');
        expect(decision.releaseDecisionHash).toBeDefined();
    });

    test('RG1 & RG3. CHAIN BREAK / NON-TERMINAL: Bloquea si falta un eslabón o no está en estado CERTIFIED', () => {
        const incompleteRecord = { ...validRecord, status: 'DRAFT' };

        const decision = ReleaseGateEngine.evaluateRelease(incompleteRecord, validManifest, validMultiFormat, validPolicy);

        expect(decision.status).toBe('RELEASE_BLOCKED');
        expect(decision.reason).toBe('INVALID_CERTIFICATION_CHAIN');
    });

    test('RG2. IDENTITY CONSISTENCY: Bloquea si las jobIdentities de los registros no coinciden', () => {
        const mismatchedManifest = { ...validManifest, jobIdentity: 'JOB_DIFFERENT' };

        const decision = ReleaseGateEngine.evaluateRelease(validRecord, mismatchedManifest, validMultiFormat, validPolicy);

        expect(decision.status).toBe('RELEASE_BLOCKED');
        expect(decision.reason).toBe('IDENTITY_CONSISTENCY_MISMATCH');
    });

    test('RG5. EXPLICIT AUTHORIZATION REQUIRED: Bloquea si la política no otorga autorización explícita', () => {
        const unauthorizedPolicy = { ...validPolicy, authorizationStatus: 'PENDING_REVIEW' };

        const decision = ReleaseGateEngine.evaluateRelease(validRecord, validManifest, validMultiFormat, unauthorizedPolicy);

        expect(decision.status).toBe('RELEASE_BLOCKED');
        expect(decision.reason).toBe('EXPLICIT_AUTHORIZATION_REQUIRED');
    });

    test('RG6 & RG8. DETERMINISTIC DECISION HASH: El hash es inmune a timestamps y telemetría de ejecución', () => {
        const policyA = { ...validPolicy, timestamp: '2026-08-22T00:00:00.000Z' };
        const policyB = { ...validPolicy, timestamp: '2026-08-22T23:59:59.000Z' };

        const decA = ReleaseGateEngine.evaluateRelease(validRecord, validManifest, validMultiFormat, policyA);
        const decB = ReleaseGateEngine.evaluateRelease(validRecord, validManifest, validMultiFormat, policyB);

        expect(decA.releaseDecisionHash).toBe(decB.releaseDecisionHash);
    });

    test('RG7. IMMUTABLE DECISION: El veredicto está congelado contra mutaciones externas', () => {
        const decision = ReleaseGateEngine.evaluateRelease(validRecord, validManifest, validMultiFormat, validPolicy);

        expect(() => {
            decision.status = 'RELEASE_BLOCKED';
        }).toThrow();
    });
});