/**
 * E24.4.1 — Artifact Identity Contract Suite
 * 
 * Fase: RED / IMPLEMENTATION
 * 
 * Contrato de Identidad de Artefacto:
 * - 1. VALID ARTIFACT IDENTITY: Genera un contentHash SHA-256 determinista a partir del payload canónico.
 * - 2. KEY ORDER INDEPENDENCE: La permutación de propiedades JSON no altera el contentHash.
 * - 3. SEMANTIC SENSITIVITY: Cualquier alteración en el contenido del payload modifica de inmediato el hash.
 * - 4. RUNTIME EXCLUSION: Agregar metadatos de telemetría volátil no altera la identidad criptográfica.
 * - 5. MULTI-EXECUTION INVARIANCE: Distintos executionId para el mismo trabajo producen idéntico contentHash.
 * - 6. IMMUTABILITY: Las funciones operan de forma pura sin mutar el artefacto original.
 */

'use strict';

const ArtifactIdentityEngine = require('../../../src/validadores/E24/ArtifactIdentityEngine');

describe('E24.4.1 — Artifact Identity Contract', () => {

    const baseArtifactMock = Object.freeze({
        artifactId: 'ART-E21-001',
        artifactType: 'SOURCE_AST_NODE',
        jobIdentity: 'ABC123SHA256JOBIDENTITY',
        schemaVersion: '1.0.0',
        payload: {
            nodeId: 'ROOT_ARTICULO_1',
            domainType: 'ARTICULO',
            content: 'Texto constitucional normativo...'
        }
    });

    test('1. VALID ARTIFACT IDENTITY: Genera un contentHash SHA-256 determinista', () => {
        const identity1 = ArtifactIdentityEngine.computeIdentity(baseArtifactMock);
        const identity2 = ArtifactIdentityEngine.computeIdentity(baseArtifactMock);

        expect(identity1).toBeDefined();
        expect(typeof identity1.contentHash).toBe('string');
        expect(identity1.contentHash.length).toBe(64); // SHA-256 hex
        expect(identity1.contentHash).toBe(identity2.contentHash);
    });

    test('2. KEY ORDER INDEPENDENCE: La permutación de propiedades JSON no altera el contentHash', () => {
        const shuffledArtifact = {
            payload: baseArtifactMock.payload,
            schemaVersion: baseArtifactMock.schemaVersion,
            jobIdentity: baseArtifactMock.jobIdentity,
            artifactType: baseArtifactMock.artifactType,
            artifactId: baseArtifactMock.artifactId
        };

        const hash1 = ArtifactIdentityEngine.computeIdentity(baseArtifactMock).contentHash;
        const hash2 = ArtifactIdentityEngine.computeIdentity(shuffledArtifact).contentHash;

        expect(hash2).toBe(hash1);
    });

    test('3. SEMANTIC SENSITIVITY: Modificar un campo del payload altera de inmediato el contentHash', () => {
        const modifiedArtifact = JSON.parse(JSON.stringify(baseArtifactMock));
        modifiedArtifact.payload.content = 'Texto constitucional modificado...';

        const hash1 = ArtifactIdentityEngine.computeIdentity(baseArtifactMock).contentHash;
        const hash2 = ArtifactIdentityEngine.computeIdentity(modifiedArtifact).contentHash;

        expect(hash2).not.toBe(hash1);
    });

    test('4. RUNTIME EXCLUSION: Agregar metadatos volátiles no altera el contentHash', () => {
        const artifactWithRuntime = {
            ...baseArtifactMock,
            runtimeTelemetry: {
                timestamp: '2026-08-21T21:00:00Z',
                generatorPid: 9812
            }
        };

        const hash1 = ArtifactIdentityEngine.computeIdentity(baseArtifactMock).contentHash;
        const hash2 = ArtifactIdentityEngine.computeIdentity(artifactWithRuntime).contentHash;

        expect(hash2).toBe(hash1);
    });

    test('5. MULTI-EXECUTION INVARIANCE: Distintos executionId para el mismo trabajo producen idéntico contentHash', () => {
        const artifactExec1 = { ...baseArtifactMock, executionId: 'EXEC_001' };
        const artifactExec2 = { ...baseArtifactMock, executionId: 'EXEC_002' };

        const hash1 = ArtifactIdentityEngine.computeIdentity(artifactExec1).contentHash;
        const hash2 = ArtifactIdentityEngine.computeIdentity(artifactExec2).contentHash;

        expect(hash1).toBe(hash2);
    });

    test('6. IMMUTABILITY: Las funciones operan de forma pura sin mutar el artefacto original', () => {
        const snapshotBefore = JSON.stringify(baseArtifactMock);
        ArtifactIdentityEngine.computeIdentity(baseArtifactMock);
        const snapshotAfter = JSON.stringify(baseArtifactMock);

        expect(snapshotAfter).toBe(snapshotBefore);
    });

});