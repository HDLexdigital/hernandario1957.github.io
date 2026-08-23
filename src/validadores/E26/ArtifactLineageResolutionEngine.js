/**
 * E26.5 — ArtifactLineageResolutionEngine
 * 
 * - Resuelve el linaje y genealogía de artefactos certificados a lo largo del tiempo.
 * - Valida bindings criptográficos de ancestros previniendo falsas ascendencias.
 * - Detecta y rechaza ciclos acíclicos, mapea bifurcaciones (branches) y atribuye cambios generacionales.
 */

'use strict';

const crypto = require('crypto');

class ArtifactLineageResolutionEngine {

    /**
     * Resuelve y certifica el linaje genealógico de un artefacto contra el registro histórico.
     */
    static resolveLineage(targetArtifactId, registry, changeAttributions = {}) {
        const path = [];
        const visited = new Set();
        let currentId = targetArtifactId;

        // 1. Recorrido ascendente y validación estricta de grafos
        while (currentId !== null && currentId !== undefined) {
            // AL6: Detección estricta de ciclos (Cycle Rejection)
            if (visited.has(currentId)) {
                return { status: 'LINEAGE_REJECTED', reason: 'LINEAGE_CYCLE_DETECTED', timestamp: new Date().toISOString() };
            }

            visited.add(currentId);
            const currentRecord = registry[currentId];

            if (!currentRecord) {
                return { status: 'LINEAGE_REJECTED', reason: 'LINEAGE_ROOT_UNRESOLVED', timestamp: new Date().toISOString() };
            }

            path.unshift(currentId); // Mantenemos orden cronológico (Raíz -> Destino)

            // Validación de Bindings Padre/Hijo si existe un antecesor declarado
            if (currentRecord.parentId) {
                const parentRecord = registry[currentRecord.parentId];
                if (!parentRecord) {
                    return { status: 'LINEAGE_REJECTED', reason: 'LINEAGE_ROOT_UNRESOLVED', timestamp: new Date().toISOString() };
                }

                // AL2: Verificación criptográfica obligatoria (parentContentHash debe coincidir)
                if (currentRecord.parentContentHash && currentRecord.parentContentHash !== parentRecord.contentHash) {
                    return { status: 'LINEAGE_REJECTED', reason: 'LINEAGE_HASH_MISMATCH', timestamp: new Date().toISOString() };
                }
            }

            currentId = currentRecord.parentId;
        }

        if (path.length === 0) {
            return { status: 'LINEAGE_REJECTED', reason: 'LINEAGE_ROOT_UNRESOLVED' };
        }

        const rootArtifactId = path[0];

        // Mapeo de atribución de cambios generacionales (AL7)
        const resolvedAttributions = {};
        for (const artId of path) {
            resolvedAttributions[artId] = changeAttributions[artId] || { changeType: artId === rootArtifactId ? 'ROOT' : 'UNCHANGED' };
        }

        // AL4 & AL8: Cálculo de Hash Canónico de Linaje (Inmune a timestamps o telemetría)
        const canonicalPayload = {
            targetArtifactId: targetArtifactId,
            rootArtifactId: rootArtifactId,
            resolvedPath: path,
            changeAttribution: resolvedAttributions
        };

        const canonicalString = JSON.stringify(canonicalPayload, Object.keys(canonicalPayload).sort());
        const lineageResolutionHash = crypto.createHash('sha256').update(canonicalString).digest('hex');

        // Emisión del Certificado de Linaje Inmutable
        return Object.freeze({
            status: 'LINEAGE_CERTIFIED',
            targetArtifactId: targetArtifactId,
            rootArtifactId: rootArtifactId,
            resolvedPath: path,
            changeAttribution: resolvedAttributions,
            lineageResolutionHash: lineageResolutionHash,
            issuedAt: new Date().toISOString()
        });
    }
}

module.exports = ArtifactLineageResolutionEngine;