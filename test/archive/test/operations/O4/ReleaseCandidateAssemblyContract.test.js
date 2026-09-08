/**
 * O4.1 — Release Candidate Assembly Contract Suite (R1–R8)
 */

'use strict';

const path = require('path');
const ReleaseCandidateAssemblyEngine = require(path.join(process.cwd(), 'src', 'operations', 'O4', 'ReleaseCandidateAssemblyEngine'));

describe('O4.1 — Release Candidate Assembly Contract Suite (R1–R8)', () => {

    let assemblyEngine;

    beforeEach(() => {
        assemblyEngine = new ReleaseCandidateAssemblyEngine();
    });

    test('R1, R2, R3, R5, R6 & R7. CAMINO VERDE: Ensambla un Release Candidate válido, determinista e íntegro', () => {
        const payload = {
            jobIdentity: 'JOB_LEGAL_CORPUS_01',
            executionId: 'EXEC_RC_001',
            certificationMetadata: {
                status: 'CERTIFIED',
                certificateHash: 'sha256_mock_cert_hash'
            },
            artifacts: [
                { artifactId: 'ART_EPUB', artifactHash: 'sha256_epub', certified: true },
                { artifactId: 'ART_PDF', artifactHash: 'sha256_pdf', certified: true }
            ]
        };

        const candidate = assemblyEngine.assembleCandidate('RC_2026_001', payload);

        expect(candidate.status).toBe('CANDIDATE_READY');
        expect(candidate.candidateHash).toBeDefined();
        expect(candidate.certificationBinding).toBe('sha256_mock_cert_hash');
    });

    test('R4. RELEASE AUTHORIZATION BOUNDARY: O4.1 jamás emite RELEASE_AUTHORIZED', () => {
        const payload = {
            jobIdentity: 'JOB_LEGAL_CORPUS_02',
            executionId: 'EXEC_RC_002',
            certificationMetadata: { status: 'CERTIFIED', certificateHash: 'hash_cert' },
            artifacts: [{ artifactId: 'ART_1', artifactHash: 'hash_art', certified: true }]
        };

        const candidate = assemblyEngine.assembleCandidate('RC_2026_002', payload);
        expect(candidate.status).not.toBe('RELEASE_AUTHORIZED');
        expect(candidate.status).toBe('CANDIDATE_READY');
    });

    test('R1. CERTIFICATION REQUIRED: Rechaza artefactos sin certificación E26 válida', () => {
        const payload = {
            jobIdentity: 'JOB_LEGAL_CORPUS_03',
            executionId: 'EXEC_RC_003',
            certificationMetadata: { status: 'PENDING', certificateHash: null },
            artifacts: [{ artifactId: 'ART_1', artifactHash: 'hash_art', certified: false }]
        };

        expect(() => {
            assemblyEngine.assembleCandidate('RC_2026_003', payload);
        }).toThrow('CERTIFICATION_REQUIRED');
    });

    test('R8. IMMUTABLE CANDIDATE: Rechaza la sobreescritura de un candidate ya sellado', () => {
        const payload = {
            jobIdentity: 'JOB_LEGAL_CORPUS_04',
            executionId: 'EXEC_RC_004',
            certificationMetadata: { status: 'CERTIFIED', certificateHash: 'hash_cert' },
            artifacts: [{ artifactId: 'ART_1', artifactHash: 'hash_art', certified: true }]
        };

        assemblyEngine.assembleCandidate('RC_2026_004', payload);

        expect(() => {
            assemblyEngine.assembleCandidate('RC_2026_004', payload);
        }).toThrow('CANDIDATE_IMMUTABILITY_VIOLATION');
    });
});