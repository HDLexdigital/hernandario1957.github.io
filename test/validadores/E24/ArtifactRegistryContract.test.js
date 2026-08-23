/**
 * E24.4.3 — Artifact Registry Engine Contract Suite
 * 
 * Fase: VERDE / IMPLEMENTATION
 * 
 * Contrato del Registro de Artefactos (In-memory, Append-Only):
 * - 1. REGISTRATION VALID: Registra con éxito artefactos válidos.
 * - 2. JOB ISOLATION & GROUPING: Agrupa por jobIdentity y mantiene aislamiento absoluto entre jobs.
 * - 3 & 4. APPEND-ONLY & IDEMPOTENT REPLAY: Impide sobrescribir y acepta registros duplicados idénticos de forma segura.
 * - 5. CONFLICT REJECTION: Rechaza colisiones de ID con payloads semánticos diferentes.
 * - 6. PROVENANCE INTEGRITY: Exige que los artefactos referenciados por ProvenanceLink existan en el registro.
 * - 7. DETERMINISTIC QUERIES: Las consultas (get, list, has, provenance) son deterministas y puras.
 * - 8. EXTERNAL IMMUTABILITY: Protege el almacenamiento interno frente a mutaciones externas.
 */

'use strict';

const ArtifactRegistryEngine = require('../../../src/validadores/E24/ArtifactRegistryEngine');

describe('E24.4.3 — Artifact Registry Engine Contract', () => {

    let registry;

    beforeEach(() => {
        registry = new ArtifactRegistryEngine();
    });

    const artifactA = {
        artifactId: 'ART-01',
        artifactType: 'SOURCE_AST',
        jobIdentity: 'JOB_ALPHA',
        schemaVersion: '1.0.0',
        payload: { content: 'Contenido A' }
    };

    const artifactB = {
        artifactId: 'ART-02',
        artifactType: 'PROJECTION_PLAN',
        jobIdentity: 'JOB_ALPHA',
        schemaVersion: '1.0.0',
        payload: { content: 'Contenido B' }
    };

    const artifactBeta = {
        artifactId: 'ART-01',
        artifactType: 'SOURCE_AST',
        jobIdentity: 'JOB_BETA',
        schemaVersion: '1.0.0',
        payload: { content: 'Contenido Beta' }
    };

    test('1. REGISTRATION VALID: Registra exitosamente artefactos válidos', () => {
        const result = registry.registerArtifact(artifactA);

        expect(result.status).toBe('REGISTERED');
        expect(result.contentHash).toBeDefined();
        expect(registry.hasArtifact('JOB_ALPHA', 'ART-01')).toBe(true);
    });

    test('2. JOB ISOLATION & GROUPING: Agrupa por jobIdentity y aísla los espacios de trabajo', () => {
        registry.registerArtifact(artifactA);
        registry.registerArtifact(artifactBeta);

        const alphaArtifacts = registry.listArtifacts('JOB_ALPHA');
        const betaArtifacts = registry.listArtifacts('JOB_BETA');

        expect(alphaArtifacts.length).toBe(1);
        expect(alphaArtifacts[0].artifactId).toBe('ART-01');
        expect(alphaArtifacts[0].jobIdentity).toBe('JOB_ALPHA');

        expect(betaArtifacts.length).toBe(1);
        expect(betaArtifacts[0].jobIdentity).toBe('JOB_BETA');
    });

    test('3 & 4. APPEND-ONLY & IDEMPOTENT REPLAY: Reintento con idéntico artefacto es idempotente y seguro', () => {
        registry.registerArtifact(artifactA);
        const repeatResult = registry.registerArtifact(artifactA);

        expect(repeatResult.status).toBe('ALREADY_REGISTERED');
        expect(registry.listArtifacts('JOB_ALPHA').length).toBe(1);
    });

    test('5. CONFLICT REJECTION: Rechaza colisiones de ID con contenido semántico diferente', () => {
        registry.registerArtifact(artifactA);

        const conflictingArtifact = {
            ...artifactA,
            payload: { content: 'Contenido mutado fraudulentamente' }
        };

        expect(() => {
            registry.registerArtifact(conflictingArtifact);
        }).toThrow(/ARTIFACT_REGISTRY_VIOLATION:.*CONFLICT_DETECTED/);
    });

    test('6. PROVENANCE INTEGRITY: Exige que los artefactos referenciados por ProvenanceLink existan previamente', () => {
        const regA = registry.registerArtifact(artifactA);
        const regB = registry.registerArtifact(artifactB);

        const linkData = {
            previousArtifactHash: regA.contentHash,
            currentArtifactHash: regB.contentHash,
            relation: 'DERIVED_FROM',
            stage: 'E21_TO_E23'
        };

        const provResult = registry.registerProvenance('JOB_ALPHA', linkData);
        expect(provResult.status).toBe('PROVENANCE_REGISTERED');
        expect(registry.getProvenance('JOB_ALPHA').length).toBe(1);

        // Intento de registrar enlace con hash desconocido
        const badLinkData = {
            previousArtifactHash: 'BAD_HASH_NON_EXISTENT',
            currentArtifactHash: regB.contentHash,
            relation: 'DERIVED_FROM',
            stage: 'FAIL_STAGE'
        };

        expect(() => {
            registry.registerProvenance('JOB_ALPHA', badLinkData);
        }).toThrow(/ARTIFACT_REGISTRY_VIOLATION:.*PROVENANCE_INTEGRITY_FAILURE/);
    });

    test('7. DETERMINISTIC QUERIES: Las consultas del registro son deterministas y limpias', () => {
        registry.registerArtifact(artifactA);
        
        const retrieved1 = registry.getArtifact('JOB_ALPHA', 'ART-01');
        const retrieved2 = registry.getArtifact('JOB_ALPHA', 'ART-01');

        expect(retrieved1).toEqual(retrieved2);
        expect(registry.getArtifact('JOB_ALPHA', 'NON_EXISTENT')).toBeNull();
    });

    test('8. EXTERNAL IMMUTABILITY: Protege los registros internos contra mutaciones externas', () => {
        registry.registerArtifact(artifactA);
        const externalRef = registry.getArtifact('JOB_ALPHA', 'ART-01');

        externalRef.payload.content = 'Intento de hackeo en memoria';

        const internalRef = registry.getArtifact('JOB_ALPHA', 'ART-01');
        expect(internalRef.payload.content).toBe('Contenido A');
    });

});