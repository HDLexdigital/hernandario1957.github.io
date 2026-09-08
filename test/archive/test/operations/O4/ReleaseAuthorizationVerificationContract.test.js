/**
 * O4.2 — Release Authorization Verification Contract Suite (A1–A8)
 */

'use strict';

const path = require('path');
const ReleaseAuthorizationVerificationEngine = require(path.join(process.cwd(), 'src', 'operations', 'O4', 'ReleaseAuthorizationVerificationEngine'));

describe('O4.2 — Release Authorization Verification Contract Suite (A1–A8)', () => {

    let authEngine;
    let validCandidate;

    beforeEach(() => {
        authEngine = new ReleaseAuthorizationVerificationEngine();
        
        validCandidate = Object.freeze({
            candidateId: 'RC_2026_001',
            jobIdentity: 'JOB_LEGAL_CORPUS_01',
            executionId: 'EXEC_RC_001',
            certificationBinding: 'sha256_mock_cert_hash',
            status: 'CANDIDATE_READY'
        });
    });

    test('A1, A2, A3, A5 & A8. CAMINO VERDE: Verifica una autorización legítima y emite RELEASE_AUTHORIZED', () => {
        authEngine.registerAuthorization('AUTH_GATE_001', {
            candidateId: 'RC_2026_001',
            jobIdentity: 'JOB_LEGAL_CORPUS_01',
            executionId: 'EXEC_RC_001',
            certificateBinding: 'sha256_mock_cert_hash',
            status: 'AUTHORIZED_ACTIVE'
        });

        const result = authEngine.verifyAuthorization(validCandidate, 'AUTH_GATE_001');

        expect(result.status).toBe('RELEASE_AUTHORIZED');
        expect(result.authorizationVerdictHash).toBeDefined();
    });

    test('A7. NO IMPLICIT AUTHORIZATION: CANDIDATE_READY nunca equivale automáticamente a AUTHORIZED sin registro', () => {
        expect(() => {
            authEngine.verifyAuthorization(validCandidate, 'AUTH_NON_EXISTENT');
        }).toThrow('AUTHORIZATION_NOT_FOUND');
    });

    test('A1. IDENTITY BINDING: Rechaza autorizaciones con divergencia de executionId o jobIdentity', () => {
        authEngine.registerAuthorization('AUTH_GATE_002', {
            candidateId: 'RC_2026_001',
            jobIdentity: 'DIFFERENT_JOB',
            executionId: 'EXEC_RC_001',
            certificateBinding: 'sha256_mock_cert_hash',
            status: 'AUTHORIZED_ACTIVE'
        });

        expect(() => {
            authEngine.verifyAuthorization(validCandidate, 'AUTH_GATE_002');
        }).toThrow('CANDIDATE_IDENTITY_MISMATCH');
    });

    test('A6. TEMPORAL / STATE VALIDITY: Rechaza autorizaciones revocadas o inactivas', () => {
        authEngine.registerAuthorization('AUTH_GATE_003', {
            candidateId: 'RC_2026_001',
            jobIdentity: 'JOB_LEGAL_CORPUS_01',
            executionId: 'EXEC_RC_001',
            certificateBinding: 'sha256_mock_cert_hash',
            status: 'REVOKED'
        });

        expect(() => {
            authEngine.verifyAuthorization(validCandidate, 'AUTH_GATE_003');
        }).toThrow('AUTHORIZATION_EXPIRED_OR_REVOKED');
    });
});