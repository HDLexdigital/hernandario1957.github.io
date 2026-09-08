/**
 * E26.2 — Certified Artifact Manifest Contract Suite
 * 
 * Fase: GOVERNANCE / IMPLEMENTATION
 * 
 * Contrato de Inventario Criptográfico de Entrega (Certified Artifact Manifest):
 * - M1. CERTIFICATION BINDING: Exige un CertificationRecord válido emitido por E26.1.
 * - M2. JOB IDENTITY BINDING: Todos los artefactos deben pertenecer estrictamente al mismo jobIdentity.
 * - M3. ARTIFACT COMPLETENESS: Valida que el set obligatorio de entregables esté completo y sin duplicados.
 * - M4 & M5. INTEGRITY & NO UNCERTIFIED: Rechaza artefactos sin identidades hash resolubles o ajenos a la certificación.
 * - M6 & M7. DETERMINISTIC HASH & RUNTIME EXCLUSION: Calcula un manifestHash canónico aislado de timestamps y telemetría.
 * - M8 & M9. DEFENSIVE IMMUTABILITY & TERMINAL STATE: Garantiza inmutabilidad defensiva total y estado terminal CERTIFIED.
 */

'use strict';

const CertifiedArtifactManifestEngine = require('../../../src/validadores/E26/CertifiedArtifactManifestEngine');

describe('E26.2 — Certified Artifact Manifest Contract', () => {

    let validRecord;
    let validArtifactSet;

    beforeEach(() => {
        validRecord = {
            status: 'PRODUCTION_CERTIFIED',
            jobIdentity: 'JOB_RELEASE_999',
            certificationHash: 'CERT_HASH_ABC123'
        };

        validArtifactSet = [
            { artifactId: 'ART_INDD_01', artifactType: 'INDD', jobIdentity: 'JOB_RELEASE_999', contentHash: 'HASH_INDD_01', provenanceHash: 'PROV_01' },
            { artifactId: 'ART_PDF_01', artifactType: 'PDF', jobIdentity: 'JOB_RELEASE_999', contentHash: 'HASH_PDF_01', provenanceHash: 'PROV_02' },
            { artifactId: 'ART_EPUB_01', artifactType: 'EPUB', jobIdentity: 'JOB_RELEASE_999', contentHash: 'HASH_EPUB_01', provenanceHash: 'PROV_03' }
        ];
    });

    test('M1, M3 & M9. BINDING, COMPLETENESS & STATE: Genera manifiesto certificado completo con estado terminal', () => {
        const manifest = CertifiedArtifactManifestEngine.createManifest(validRecord, validArtifactSet);

        expect(manifest).toBeDefined();
        expect(manifest.status).toBe('CERTIFIED');
        expect(manifest.artifacts.length).toBe(3);
        expect(manifest.jobIdentity).toBe('JOB_RELEASE_999');
    });

    test('M1 & M2. RECORD VALIDATION & JOB IDENTITY: Rechaza si falta registro o hay desajuste de jobIdentity', () => {
        const invalidRecord = null;
        const mismatchArtifacts = [
            { artifactId: 'ART_INDD_01', artifactType: 'INDD', jobIdentity: 'JOB_DIFFERENT_JOB', contentHash: 'HASH_INDD_01', provenanceHash: 'PROV_01' }
        ];

        const resNoRecord = CertifiedArtifactManifestEngine.createManifest(invalidRecord, validArtifactSet);
        const resMismatch = CertifiedArtifactManifestEngine.createManifest(validRecord, mismatchArtifacts);

        expect(resNoRecord.status).toBe('MANIFEST_REJECTED');
        expect(resMismatch.status).toBe('MANIFEST_REJECTED');
    });

    test('M4 & M5. UNCERTIFIED ARTIFACTS REJECTION: Rechaza inventarios con datos incompletos o malformados', () => {
        const incompleteArtifacts = [
            { artifactId: 'ART_INDD_01', artifactType: 'INDD', jobIdentity: 'JOB_RELEASE_999' } // Falta contentHash y provenanceHash
        ];

        const result = CertifiedArtifactManifestEngine.createManifest(validRecord, incompleteArtifacts);

        expect(result.status).toBe('MANIFEST_REJECTED');
        expect(result.reason).toBe('INVALID_OR_UNCERTIFIED_ARTIFACT');
    });

    test('M6 & M7. DETERMINISTIC MANIFEST HASH & RUNTIME EXCLUSION: El manifestHash es inmune a la telemetría y timestamps', () => {
        const setA = { ...validRecord, timestamp: '2026-08-22T00:00:00.000Z' };
        const setB = { ...validRecord, timestamp: '2026-08-22T15:45:00.000Z' };

        const manifest1 = CertifiedArtifactManifestEngine.createManifest(setA, validArtifactSet);
        const manifest2 = CertifiedArtifactManifestEngine.createManifest(setB, validArtifactSet);

        expect(manifest1.manifestHash).toBe(manifest2.manifestHash);
    });

    test('M8. DEFENSIVE IMMUTABILITY: El manifiesto y sus arrays están congelados contra mutaciones externas', () => {
        const manifest = CertifiedArtifactManifestEngine.createManifest(validRecord, validArtifactSet);

        expect(() => {
            manifest.status = 'DRAFT';
        }).toThrow();

        expect(() => {
            manifest.artifacts.push({});
        }).toThrow();
    });
});