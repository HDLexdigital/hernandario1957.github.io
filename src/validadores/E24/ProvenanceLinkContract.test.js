/**
 * E24.4.2 — Provenance Link Contract Suite
 * 
 * Fase: VERDE / IMPLEMENTATION
 * 
 * Contrato de Enlace de Procedencia:
 * - 1. DETERMINISM: Mismo enlace lógico produce idéntico provenanceHash determinista.
 * - 2. KEY ORDER INDEPENDENCE: La permutación de propiedades JSON no altera el hash del vínculo.
 * - 3. PREDECESSOR SENSITIVITY: Cambiar el previousArtifactHash modifica de inmediato el provenanceHash.
 * - 4. SUCCESSFUL SENSITIVITY: Cambiar el currentArtifactHash modifica de inmediato el provenanceHash.
 * - 5. RELATION SENSITIVITY: Modificar la relación (ej. DERIVED_FROM vs PROJECTED_FROM) altera el hash.
 * - 6. RUNTIME EXCLUSION: Agregar metadatos de ejecución no altera el provenanceHash del vínculo.
 * - 7. NO CIRCULARITY: El provenanceHash no participa de forma circular en la entrada que lo genera.
 * - 8. IMMUTABILITY: Las funciones operan de forma pura sin mutar los objetos originales.
 */

'use strict';

const ProvenanceLinkEngine = require('../../../src/validadores/E24/ProvenanceLinkEngine');

describe('E24.4.2 — Provenance Link Contract', () => {

    const baseLinkMock = Object.freeze({
        previousArtifactHash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
        currentArtifactHash: '123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0a1b2',
        relation: 'DERIVED_FROM',
        stage: 'E22_TO_E23'
    });

    test('1. DETERMINISM: Genera un provenanceHash SHA-256 determinista y estable', () => {
        const link1 = ProvenanceLinkEngine.computeLink(baseLinkMock);
        const link2 = ProvenanceLinkEngine.computeLink(baseLinkMock);

        expect(link1).toBeDefined();
        expect(typeof link1.provenanceHash).toBe('string');
        expect(link1.provenanceHash.length).toBe(64); // SHA-256 hex
        expect(link1.provenanceHash).toBe(link2.provenanceHash);
    });

    test('2. KEY ORDER INDEPENDENCE: La permutación de propiedades JSON no altera el provenanceHash', () => {
        const shuffledLink = {
            stage: baseLinkMock.stage,
            relation: baseLinkMock.relation,
            currentArtifactHash: baseLinkMock.currentArtifactHash,
            previousArtifactHash: baseLinkMock.previousArtifactHash
        };

        const hash1 = ProvenanceLinkEngine.computeLink(baseLinkMock).provenanceHash;
        const hash2 = ProvenanceLinkEngine.computeLink(shuffledLink).provenanceHash;

        expect(hash2).toBe(hash1);
    });

    test('3. PREDECESSOR SENSITIVITY: Cambiar el previousArtifactHash modifica el provenanceHash', () => {
        const modifiedLink = {
            ...baseLinkMock,
            previousArtifactHash: '9999999999abcdef0123456789abcdef0123456789abcdef0123456789abcdef0'
        };

        const hash1 = ProvenanceLinkEngine.computeLink(baseLinkMock).provenanceHash;
        const hash2 = ProvenanceLinkEngine.computeLink(modifiedLink).provenanceHash;

        expect(hash2).not.toBe(hash1);
    });

    test('4. SUCCESSOR SENSITIVITY: Cambiar el currentArtifactHash modifica el provenanceHash', () => {
        const modifiedLink = {
            ...baseLinkMock,
            currentArtifactHash: '8888888888abcdef0123456789abcdef0123456789abcdef0123456789abcdef0'
        };

        const hash1 = ProvenanceLinkEngine.computeLink(baseLinkMock).provenanceHash;
        const hash2 = ProvenanceLinkEngine.computeLink(modifiedLink).provenanceHash;

        expect(hash2).not.toBe(hash1);
    });

    test('5. RELATION SENSITIVITY: Modificar la relación cambia de inmediato el provenanceHash', () => {
        const modifiedLink = {
            ...baseLinkMock,
            relation: 'PROJECTED_FROM'
        };

        const hash1 = ProvenanceLinkEngine.computeLink(baseLinkMock).provenanceHash;
        const hash2 = ProvenanceLinkEngine.computeLink(modifiedLink).provenanceHash;

        expect(hash2).not.toBe(hash1);
    });

    test('6. RUNTIME EXCLUSION: Agregar metadatos de ejecución no altera el provenanceHash', () => {
        const linkWithRuntime = {
            ...baseLinkMock,
            executionId: 'EXEC_ATTEMPT_999',
            timestamp: '2026-08-21T21:30:00Z'
        };

        const hash1 = ProvenanceLinkEngine.computeLink(baseLinkMock).provenanceHash;
        const hash2 = ProvenanceLinkEngine.computeLink(linkWithRuntime).provenanceHash;

        expect(hash2).toBe(hash1);
    });

    test('7. IMMUTABILITY: Las funciones operan de forma pura sin mutar el enlace original', () => {
        const snapshotBefore = JSON.stringify(baseLinkMock);
        ProvenanceLinkEngine.computeLink(baseLinkMock);
        const snapshotAfter = JSON.stringify(baseLinkMock);

        expect(snapshotAfter).toBe(snapshotBefore);
    });

});