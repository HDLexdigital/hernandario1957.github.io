/**
 * E26.5 — Artifact Lineage Resolution Contract Suite
 * 
 * Fase: GOVERNANCE / IMPLEMENTATION
 * 
 * Contrato de Resolución Genealógica y Linaje de Artefactos (E26.5):
 * - AL1 & AL2. ROOT & PARENT BINDING: Resuelve la ascendencia hasta la raíz mediante bindings criptográficos verificables.
 * - AL3. NO FALSE ANCESTRY: Rechaza parentescos basados en nombres o versiones superficiales sin hash.
 * - AL4. DETERMINISTIC RESOLUTION: La resolución del grafo es totalmente determinista e inmune al runtime.
 * - AL5. BRANCH / FORK DETECTION: Soporta y mapea correctamente bifurcaciones y ramas de publicación.
 * - AL6. CYCLE REJECTION: Rechaza tajantemente grafos con ciclos genealógicos (LINEAGE_CYCLE_DETECTED).
 * - AL7. CHANGE ATTRIBUTION: Clasifica los cambios generacionales (UNCHANGED, MODIFIED, ADDED, REMOVED).
 * - AL8. IMMUTABLE CERTIFICATE: Emite un linaje certificado con su propio lineageResolutionHash canónico.
 */

'use strict';

const ArtifactLineageResolutionEngine = require('../../../src/validadores/E26/ArtifactLineageResolutionEngine');

describe('E26.5 — Artifact Lineage Resolution Contract', () => {

    let lineageRegistry;

    beforeEach(() => {
        lineageRegistry = {
            'ART_V1': { artifactId: 'ART_V1', contentHash: 'HASH_V1', parentId: null },
            'ART_V2': { artifactId: 'ART_V2', contentHash: 'HASH_V2', parentId: 'ART_V1', parentContentHash: 'HASH_V1' },
            'ART_V3': { artifactId: 'ART_V3', contentHash: 'HASH_V3', parentId: 'ART_V2', parentContentHash: 'HASH_V2' },
            // Bifurcación (Branch) desde V2
            'ART_BRANCH_FORK': { artifactId: 'ART_BRANCH_FORK', contentHash: 'HASH_FORK', parentId: 'ART_V2', parentContentHash: 'HASH_V2' },
            // Nodo con ciclo malicioso
            'ART_CYCLE_A': { artifactId: 'ART_CYCLE_A', contentHash: 'HASH_CA', parentId: 'ART_CYCLE_B' },
            'ART_CYCLE_B': { artifactId: 'ART_CYCLE_B', contentHash: 'HASH_CB', parentId: 'ART_CYCLE_A' }
        };
    });

    test('AL1, AL2 & AL8. LINEAGE ROOT & HASH CERTIFICATE: Resuelve el linaje hasta la raíz y emite hash canónico', () => {
        const resolution = ArtifactLineageResolutionEngine.resolveLineage('ART_V3', lineageRegistry);

        expect(resolution.status).toBe('LINEAGE_CERTIFIED');
        expect(resolution.rootArtifactId).toBe('ART_V1');
        expect(resolution.resolvedPath).toEqual(['ART_V1', 'ART_V2', 'ART_V3']);
        expect(resolution.lineageResolutionHash).toBeDefined();
    });

    test('AL2 & AL3. PARENT BINDING & FALSE ANCESTRY: Detecta ruptura de hashes y rechaza falsos ascendientes', () => {
        // Rompemos el parentContentHash en V3
        const registryCorrupt = {
            ...lineageRegistry,
            'ART_V3': { artifactId: 'ART_V3', contentHash: 'HASH_V3', parentId: 'ART_V2', parentContentHash: 'HASH_CORRUPT_MISMATCH' }
        };

        const resolution = ArtifactLineageResolutionEngine.resolveLineage('ART_V3', registryCorrupt);

        expect(resolution.status).toBe('LINEAGE_REJECTED');
        expect(resolution.reason).toBe('LINEAGE_HASH_MISMATCH');
    });

    test('AL5. BRANCH / FORK RESOLUTION: Resuelve adecuadamente bifurcaciones genealógicas', () => {
        const resolution = ArtifactLineageResolutionEngine.resolveLineage('ART_BRANCH_FORK', lineageRegistry);

        expect(resolution.status).toBe('LINEAGE_CERTIFIED');
        expect(resolution.resolvedPath).toEqual(['ART_V1', 'ART_V2', 'ART_BRANCH_FORK']);
    });

    test('AL6. CYCLE REJECTION: Detecta y rechaza grafos genealógicos con bucles o ciclos', () => {
        const resolution = ArtifactLineageResolutionEngine.resolveLineage('ART_CYCLE_A', lineageRegistry);

        expect(resolution.status).toBe('LINEAGE_REJECTED');
        expect(resolution.reason).toBe('LINEAGE_CYCLE_DETECTED');
    });

    test('AL7. CHANGE ATTRIBUTION: Atribuye y clasifica correctamente las modificaciones generacionales', () => {
        const diffMetadata = {
            'ART_V2': { changeType: 'MODIFIED', modifiedNodesCount: 2 },
            'ART_V3': { changeType: 'MODIFIED', modifiedNodesCount: 1 }
        };

        const resolution = ArtifactLineageResolutionEngine.resolveLineage('ART_V3', lineageRegistry, diffMetadata);

        expect(resolution.status).toBe('LINEAGE_CERTIFIED');
        expect(resolution.changeAttribution['ART_V3'].changeType).toBe('MODIFIED');
    });
});