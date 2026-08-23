/**
 * O4.4 — Distribution Manifest Contract Suite (D1–D10)
 */

'use strict';

const path = require('path');
const DistributionManifestEngine = require(path.join(process.cwd(), 'src', 'operations', 'O4', 'DistributionManifestEngine'));

describe('O4.4 — Distribution Manifest Contract Suite (D1–D10)', () => {

    let manifestEngine;
    let productionRecord;
    let candidatePayload;

    beforeEach(() => {
        manifestEngine = new DistributionManifestEngine();

        productionRecord = Object.freeze({
            candidateId: 'RC_2026_001',
            jobIdentity: 'JOB_LEGAL_CORPUS_01',
            executionId: 'EXEC_RC_001',
            promotionStatus: 'PRODUCTION',
            promotionVerdictHash: 'sha256_promotion_verdict_hash'
        });

        candidatePayload = Object.freeze({
            candidateId: 'RC_2026_001',
            certificationBinding: 'sha256_mock_cert_hash',
            artifacts: [
                { artifactId: 'ART_PDF', format: 'PDF', artifactHash: 'sha256_pdf', certified: true, path: 'out/constitucion.pdf' },
                { artifactId: 'ART_EPUB', format: 'EPUB3', artifactHash: 'sha256_epub', certified: true, path: 'out/constitucion.epub' }
            ]
        });
    });

    test('D1, D3, D5, D6, D9 & D10. CAMINO VERDE: Construye y sella un manifiesto de distribución determinista e íntegro', () => {
        const manifest = manifestEngine.buildManifest('DIST_2026_001', productionRecord, candidatePayload);

        expect(manifest.status).toBe('MANIFEST_SEALED');
        expect(manifest.distributionManifestHash).toBeDefined();
        expect(manifest.artifacts.length).toBe(2);
    });

    test('D1. PRODUCTION-ONLY ADMISSION: Rechaza construir manifiestos para artefactos que no están en PRODUCTION', () => {
        const invalidProdRecord = { ...productionRecord, promotionStatus: 'DRAFT' };

        expect(() => {
            manifestEngine.buildManifest('DIST_2026_002', invalidProdRecord, candidatePayload);
        }).toThrow('PRODUCTION_ONLY_ADMISSION');
    });

    test('D7. NO UNAUTHORIZED INCLUSION: Rechaza artefactos sin certificación o con metadatos malformados', () => {
        const maliciousPayload = {
            ...candidatePayload,
            artifacts: [
                ...candidatePayload.artifacts,
                { artifactId: 'DEBUG_LOG', format: 'LOG', artifactHash: 'hash_log', certified: false, path: 'out/debug.log' }
            ]
        };

        expect(() => {
            manifestEngine.buildManifest('DIST_2026_003', productionRecord, maliciousPayload);
        }).toThrow('UNAUTHORIZED_OR_MALFORMED_ARTIFACT');
    });

    test('D8. IMMUTABLE MANIFEST: Rechaza la sobreescritura de un manifiesto ya sellado', () => {
        manifestEngine.buildManifest('DIST_2026_004', productionRecord, candidatePayload);

        expect(() => {
            manifestEngine.buildManifest('DIST_2026_004', productionRecord, candidatePayload);
        }).toThrow('MANIFEST_IMMUTABILITY_VIOLATION');
    });
});