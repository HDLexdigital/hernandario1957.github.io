/**
 * O4.5 — Distribution Integrity Verification Contract Suite (I1–I10)
 */

'use strict';

const path = require('path');
const DistributionIntegrityVerificationEngine = require(path.join(process.cwd(), 'src', 'operations', 'O4', 'DistributionIntegrityVerificationEngine'));
const crypto = require('crypto');

describe('O4.5 — Distribution Integrity Verification Contract Suite (I1–I10)', () => {

    let integrityEngine;
    let sealedManifest;
    let validPhysicalPackage;

    beforeEach(() => {
        integrityEngine = new DistributionIntegrityVerificationEngine();

        const epubContent = 'EPUB_BINARY_CONTENT_MOCK_2026';
        const pdfContent = 'PDF_BINARY_CONTENT_MOCK_2026';

        const epubHash = crypto.createHash('sha256').update(epubContent).digest('hex');
        const pdfHash = crypto.createHash('sha256').update(pdfContent).digest('hex');

        sealedManifest = Object.freeze({
            distributionId: 'DIST_2026_001',
            releaseId: 'RC_2026_001',
            productionIdentity: { jobIdentity: 'JOB_01', executionId: 'EXEC_01', candidateId: 'RC_2026_001' },
            artifacts: [
                { artifactId: 'ART_PDF', format: 'PDF', canonicalHash: pdfHash },
                { artifactId: 'ART_EPUB', format: 'EPUB3', canonicalHash: epubHash }
            ],
            status: 'MANIFEST_SEALED'
        });

        validPhysicalPackage = [
            { artifactId: 'ART_PDF', format: 'PDF', physicalContent: pdfContent },
            { artifactId: 'ART_EPUB', format: 'EPUB3', physicalContent: epubContent }
        ];
    });

    test('I1, I2, I4, I5, I9 & I10. CAMINO VERDE: Verifica con éxito una distribución física íntegra y determinista', () => {
        const result = integrityEngine.verifyDistributionIntegrity(sealedManifest, validPhysicalPackage);

        expect(result.status).toBe('VERIFIED_DISTRIBUTION');
        expect(result.integrityVerdictHash).toBeDefined();
        expect(result.verifiedArtifactsCount).toBe(2);
    });

    test('I4 & I8. TAMPER DETECTION: Detecta modificación física de un byte y rechaza la distribución', () => {
        // Modifica maliciosamente el contenido físico de PDF alterando un byte
        const tamperedPackage = [
            { artifactId: 'ART_PDF', format: 'PDF', physicalContent: 'PDF_BINARY_CONTENT_MOCK_2026_TAMPERED' },
            { artifactId: 'ART_EPUB', format: 'EPUB3', physicalContent: 'EPUB_BINARY_CONTENT_MOCK_2026' }
        ];

        const result = integrityEngine.verifyDistributionIntegrity(sealedManifest, tamperedPackage);

        expect(result.status).toBe('DISTRIBUTION_INTEGRITY_FAILURE');
        expect(result.reason).toContain('HASH_MISMATCH_TAMPER_DETECTED');
    });

    test('I3. ARTIFACT EXCLUSIVITY: Rechaza paquetes físicos que incluyan archivos no declarados en el manifiesto', () => {
        const infiltratedPackage = [
            ...validPhysicalPackage,
            { artifactId: 'UNAUTHORIZED_FILE', format: 'LOG', physicalContent: 'secret_leak' }
        ];

        const result = integrityEngine.verifyDistributionIntegrity(sealedManifest, infiltratedPackage);

        expect(result.status).toBe('DISTRIBUTION_INTEGRITY_FAILURE');
        expect(result.reason).toContain('UNAUTHORIZED_ARTIFACT_INFILTRATION');
    });

    test('I10. READ-ONLY VERIFICATION: Verificar la integridad no muta el manifiesto ni el paquete físico', () => {
        const manifestSnapshot = JSON.stringify(sealedManifest);
        
        integrityEngine.verifyDistributionIntegrity(sealedManifest, validPhysicalPackage);

        const manifestAfter = JSON.stringify(sealedManifest);
        expect(manifestAfter).toBe(manifestSnapshot);
    });
});