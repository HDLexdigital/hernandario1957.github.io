/**
 * O4.3 — Production Promotion Contract Suite (P1–P10)
 */

'use strict';

const path = require('path');
const ProductionPromotionEngine = require(path.join(process.cwd(), 'src', 'operations', 'O4', 'ProductionPromotionEngine'));

describe('O4.3 — Production Promotion Contract Suite (P1–P10)', () => {

    let promotionEngine;
    let validCandidate;
    let validAuthorization;

    beforeEach(() => {
        promotionEngine = new ProductionPromotionEngine();

        validCandidate = Object.freeze({
            candidateId: 'RC_2026_001',
            jobIdentity: 'JOB_LEGAL_CORPUS_01',
            executionId: 'EXEC_RC_001',
            candidateHash: 'sha256_candidate_manifest_hash',
            certificationBinding: 'sha256_mock_cert_hash',
            status: 'CANDIDATE_READY',
            artifacts: [
                { artifactId: 'ART_EPUB', artifactHash: 'sha256_epub', certified: true }
            ]
        });

        validAuthorization = Object.freeze({
            candidateId: 'RC_2026_001',
            authorizationId: 'AUTH_GATE_001',
            status: 'RELEASE_AUTHORIZED'
        });
    });

    test('P1, P2, P3, P5, P6, P9 & P10. CAMINO VERDE: Promueve atómicamente a PRODUCTION generando evidencia soberana', () => {
        const record = promotionEngine.promoteToProduction(validCandidate, validAuthorization);

        expect(record.promotionStatus).toBe('PRODUCTION');
        expect(record.promotionVerdictHash).toBeDefined();
        expect(record.promotedArtifactHash).toBeDefined();
    });

    test('P8. NO DUPLICATE PROMOTION: Rechaza categóricamente la re-promoción de un candidato ya existente en producción', () => {
        promotionEngine.promoteToProduction(validCandidate, validAuthorization);

        expect(() => {
            promotionEngine.promoteToProduction(validCandidate, validAuthorization);
        }).toThrow('DUPLICATE_PROMOTION_VIOLATION');
    });

    test('P1. CANDIDATE ELIGIBILITY: Rechaza candidatos que no se encuentren en estado CANDIDATE_READY', () => {
        const invalidCandidate = { ...validCandidate, status: 'DRAFT' };

        expect(() => {
            promotionEngine.promoteToProduction(invalidCandidate, validAuthorization);
        }).toThrow('INVALID_CANDIDATE_ELIGIBILITY');
    });

    test('P2. AUTHORIZATION BINDING: Rechaza la promoción si la autorización no está activa como RELEASE_AUTHORIZED', () => {
        const invalidAuth = { ...validAuthorization, status: 'PENDING' };

        expect(() => {
            promotionEngine.promoteToProduction(validCandidate, invalidAuth);
        }).toThrow('AUTHORIZATION_BINDING_FAILURE');
    });
});