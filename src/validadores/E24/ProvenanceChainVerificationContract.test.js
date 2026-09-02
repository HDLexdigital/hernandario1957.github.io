/**
 * E24.4.4 — Provenance Chain Verification Contract Suite
 * 
 * Fase: VERDE / IMPLEMENTATION
 * 
 * Contrato de Verificación de Procedencia (Grafo DAG):
 * - 1. VALID DAG CHAIN: Valida exitosamente un grafo de procedencia coherente e interconectado.
 * - 2. BROKEN LINK DETECTION: Detecta rupturas criptográficas cuando un hash de vínculo no coincide con el artefacto.
 * - 3. ORPHAN ARTIFACT DETECTION: Identifica artefactos sin procedencia válida que no forman parte del grafo conectado al root.
 * - 4. JOB ISOLATION ENFORCEMENT: Rechaza enlaces o referencias cruzadas entre distintos jobIdentity.
 * - 5. DETERMINISTIC VERIFICATION: Producción idéntica de resultados y hashes de verificación ante el mismo estado.
 * - 6. RUNTIME EXCLUSION: Metadatos de ejecución no alteran el veredicto criptográfico de la cadena.
 */

'use strict';

const ArtifactRegistryEngine = require('../../../src/validadores/E24/ArtifactRegistryEngine');
const ProvenanceChainVerificationEngine = require('../../../src/validadores/E24/ProvenanceChainVerificationEngine');
const ArtifactIdentityEngine = require('../../../src/validadores/E24/ArtifactIdentityEngine');
const ProvenanceLinkEngine = require('../../../src/validadores/E24/ProvenanceLinkEngine');

describe('E24.4.4 — Provenance Chain Verification Contract', () => {

    let registry;

    beforeEach(() => {
        registry = new ArtifactRegistryEngine();
    });

    const jobIdentity = 'JOB_GRAPH_ALPHA';

    const artRoot = {
        artifactId: 'ART_ROOT_E21',
        artifactType: 'SOURCE_AST',
        jobIdentity: jobIdentity,
        payload: { name: 'Raíz Constitucional' }
    };

    const artChild = {
        artifactId: 'ART_CHILD_E23',
        artifactType: 'PROJECTION_PLAN',
        jobIdentity: jobIdentity,
        payload: { name: 'Plan InDesign' }
    };

    test('1. VALID DAG CHAIN: Valida con éxito un grafo de procedencia coherente', () => {
        const regRoot = registry.registerArtifact(artRoot);
        const regChild = registry.registerArtifact(artChild);

        const linkData = {
            previousArtifactHash: regRoot.contentHash,
            currentArtifactHash: regChild.contentHash,
            relation: 'PROJECTED_FROM',
            stage: 'E21_TO_E23'
        };
        registry.registerProvenance(jobIdentity, linkData);

        const verification = ProvenanceChainVerificationEngine.verifyChain(registry, jobIdentity, artRoot.artifactId);

        expect(verification).toBeDefined();
        expect(verification.status).toBe('PROVENANCE_CHAIN_VALID');
        expect(verification.valid).toBe(true);
        expect(verification.verifiedArtifactCount).toBe(2);
        expect(verification.verifiedLinkCount).toBe(1);
        expect(verification.orphanArtifacts.length).toBe(0);
        expect(verification.brokenLinks.length).toBe(0);
    });

    test('2. BROKEN LINK DETECTION: Detecta rupturas si un enlace apunta a un hash inexistente o alterado', () => {
        const regRoot = registry.registerArtifact(artRoot);
        const regChild = registry.registerArtifact(artChild);

        const badLinkData = {
            previousArtifactHash: 'FAKE_HASH_NON_EXISTENT_1234567890abcdef',
            currentArtifactHash: regChild.contentHash,
            relation: 'PROJECTED_FROM',
            stage: 'E21_TO_E23'
        };
        
        // Forzando registro saltándose validación de engine para probar auditoría posterior
        registry._getJobStore(jobIdentity).provenanceLinks.push({
            ...badLinkData,
            provenanceHash: 'FAKE_PROV_HASH'
        });

        const verification = ProvenanceChainVerificationEngine.verifyChain(registry, jobIdentity, artRoot.artifactId);

        expect(verification.status).toBe('PROVENANCE_CHAIN_BROKEN');
        expect(verification.valid).toBe(false);
        expect(verification.brokenLinks.length).toBeGreaterThan(0);
    });

    test('3. ORPHAN ARTIFACT DETECTION: Identifica artefactos huérfanos desconectados de la raíz', () => {
        registry.registerArtifact(artRoot);
        // artChild se registra pero no se le vincula mediante ningún ProvenanceLink
        registry.registerArtifact(artChild);

        const verification = ProvenanceChainVerificationEngine.verifyChain(registry, jobIdentity, artRoot.artifactId);

        expect(verification.status).toBe('PROVENANCE_CHAIN_BROKEN');
        expect(verification.orphanArtifacts).toContain('ART_CHILD_E23');
    });

    test('4. JOB ISOLATION ENFORCEMENT: Valida estrictamente el dominio de jobIdentity', () => {
        registry.registerArtifact(artRoot);

        const verification = ProvenanceChainVerificationEngine.verifyChain(registry, 'JOB_NON_EXISTENT', artRoot.artifactId);

        expect(verification.status).toBe('PROVENANCE_CHAIN_BROKEN');
        expect(verification.reason).toContain('JOB_NOT_FOUND');
    });

    test('5. DETERMINISTIC VERIFICATION: Mismo estado produce idéntico certificado y verificationHash', () => {
        const regRoot = registry.registerArtifact(artRoot);
        const regChild = registry.registerArtifact(artChild);

        registry.registerProvenance(jobIdentity, {
            previousArtifactHash: regRoot.contentHash,
            currentArtifactHash: regChild.contentHash,
            relation: 'PROJECTED_FROM',
            stage: 'E21_TO_E23'
        });

        const v1 = ProvenanceChainVerificationEngine.verifyChain(registry, jobIdentity, artRoot.artifactId);
        const v2 = ProvenanceChainVerificationEngine.verifyChain(registry, jobIdentity, artRoot.artifactId);

        expect(v1.verificationHash).toBe(v2.verificationHash);
    });

    test('6. RUNTIME EXCLUSION: Metadatos o telemetría adjunta no alteran el veredicto de la cadena', () => {
        const regRoot = registry.registerArtifact(artRoot);
        const regChild = registry.registerArtifact(artChild);

        registry.registerProvenance(jobIdentity, {
            previousArtifactHash: regRoot.contentHash,
            currentArtifactHash: regChild.contentHash,
            relation: 'PROJECTED_FROM',
            stage: 'E21_TO_E23',
            runtimeTelemetry: { executionDuration: 9999 } // Ruido volátil
        });

        const verification = ProvenanceChainVerificationEngine.verifyChain(registry, jobIdentity, artRoot.artifactId);
        expect(verification.status).toBe('PROVENANCE_CHAIN_VALID');
    });

});