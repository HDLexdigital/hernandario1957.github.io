/**
 * E24.4.4 — ProvenanceChainVerificationEngine (Motor de Verificación de Cadena y Grafo)
 * 
 * - Audita de forma puramente funcional el estado in-memory de un ArtifactRegistry para un jobIdentity.
 * - Valida la continuidad criptográfica, integridad referencial de vínculos y ausencia de huérfanos (DAG).
 * - Emite un certificado de verificación determinista con un verificationHash inmutable.
 */

'use strict';

const crypto = require('crypto');
const ProvenanceLinkEngine = require('./ProvenanceLinkEngine');

class ProvenanceChainVerificationEngine {
    /**
     * Ordena recursivamente las propiedades para serialización canónica estable del certificado.
     * @private
     */
    static _sortObjectKeys(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this._sortObjectKeys(item));
        }

        return Object.keys(obj)
            .sort()
            .reduce((sorted, key) => {
                sorted[key] = this._sortObjectKeys(obj[key]);
                return sorted;
            }, {});
    }

    /**
     * Audita y verifica el grafo de procedencia de un jobIdentity en el registro.
     * @param {ArtifactRegistryEngine} registry - Instancia del registro de artefactos.
     * @param {string} jobIdentity - Identidad canónica del job a auditar.
     * @param {string} rootArtifactId - Identificador del artefacto raíz (origen).
     * @returns {Object} Certificado de verificación estructurado.
     */
    static verifyChain(registry, jobIdentity, rootArtifactId) {
        if (!registry || !jobIdentity || !rootArtifactId) {
            throw new Error('PROVENANCE_VERIFICATION_VIOLATION: Faltan parámetros requeridos para la verificación.');
        }

        const artifacts = registry.listArtifacts(jobIdentity);
        const links = registry.getProvenance(jobIdentity);

        if (artifacts.length === 0 && links.length === 0) {
            return {
                jobIdentity,
                valid: false,
                status: 'PROVENANCE_CHAIN_BROKEN',
                reason: 'JOB_NOT_FOUND_OR_EMPTY',
                artifactCount: 0,
                linkCount: 0,
                verifiedArtifactCount: 0,
                verifiedLinkCount: 0,
                orphanArtifacts: [],
                brokenLinks: [],
                verificationHash: null
            };
        }

        // Mapeos de consulta rápida
        const artifactMapByHash = new Map(); // contentHash -> artifact
        const artifactMapById = new Map();   // artifactId -> artifact

        artifacts.forEach(art => {
            artifactMapByHash.set(art.contentHash, art);
            artifactMapById.set(art.artifactId, art);
        });

        const rootArt = artifactMapById.get(rootArtifactId);
        if (!rootArt) {
            return {
                jobIdentity,
                valid: false,
                status: 'PROVENANCE_CHAIN_BROKEN',
                reason: `ROOT_ARTIFACT_NOT_FOUND: '${rootArtifactId}' no existe en el registro.`,
                artifactCount: artifacts.length,
                linkCount: links.length,
                verifiedArtifactCount: 0,
                verifiedLinkCount: 0,
                orphanArtifacts: artifacts.map(a => a.artifactId),
                brokenLinks: [],
                verificationHash: null
            };
        }

        // 1. Validar integridad de cada enlace individual y construir Adjacency List para el DAG
        const brokenLinks = [];
        const verifiedLinks = [];
        const adjList = new Map(); // hash -> Set of target hashes

        artifacts.forEach(art => adjList.set(art.contentHash, new Set()));

        links.forEach((link, idx) => {
            const prevHash = link.previousArtifactHash;
            const currHash = link.currentArtifactHash;

            // Verificar existencia referencial de los nodos conectados
            const prevArt = artifactMapByHash.get(prevHash);
            const currArt = artifactMapByHash.get(currHash);

            if (!prevArt || !currArt) {
                brokenLinks.push({ linkIndex: idx, reason: 'REFERENCED_NODE_MISSING', link });
                return;
            }

            // Verificar continuidad criptográfica del vínculo utilizando el engine de E24.4.2
            try {
                const computed = ProvenanceLinkEngine.computeLink(link);
                if (computed.provenanceHash !== link.provenanceHash) {
                    brokenLinks.push({ linkIndex: idx, reason: 'HASH_MISMATCH', link });
                    return;
                }
            } catch (e) {
                brokenLinks.push({ linkIndex: idx, reason: `MALFORMED_LINK: ${e.message}`, link });
                return;
            }

            verifiedLinks.push(link);
            if (adjList.has(prevHash)) {
                adjList.get(prevHash).add(currHash);
            }
        });

        // 2. Recorrido BFS/DFS desde el root para determinar alcanzabilidad (Detectar Huérfanos / Desconectados)
        const visitedHashes = new Set();
        const queue = [rootArt.contentHash];
        visitedHashes.add(rootArt.contentHash);

        while (queue.length > 0) {
            const currentHash = queue.shift();
            const neighbors = adjList.get(currentHash) || new Set();

            neighbors.forEach(neighborHash => {
                if (!visitedHashes.has(neighborHash)) {
                    visitedHashes.add(neighborHash);
                    queue.push(neighborHash);
                }
            });
        }

        const orphanArtifacts = [];
        artifacts.forEach(art => {
            if (!visitedHashes.has(art.contentHash)) {
                orphanArtifacts.push(art.artifactId);
            }
        });

        // 3. Veredicto Final
        const isValid = brokenLinks.length === 0 && orphanArtifacts.length === 0;
        const status = isValid ? 'PROVENANCE_CHAIN_VALID' : 'PROVENANCE_CHAIN_BROKEN';

        // 4. Construcción del Payload Canónico para el Certificado de Verificación
        const certificatePayload = {
            jobIdentity,
            valid: isValid,
            status,
            rootArtifactId,
            artifactCount: artifacts.length,
            linkCount: links.length,
            verifiedArtifactCount: visitedHashes.size,
            verifiedLinkCount: verifiedLinks.length,
            orphanArtifacts: orphanArtifacts.sort(),
            brokenLinks: brokenLinks.sort((a, b) => a.linkIndex - b.linkIndex)
        };

        const sortedPayload = this._sortObjectKeys(certificatePayload);
        const canonicalString = JSON.stringify(sortedPayload);
        const verificationHash = crypto.createHash('sha256').update(canonicalString).digest('hex');

        return {
            ...certificatePayload,
            verificationHash
        };
    }
}

module.exports = ProvenanceChainVerificationEngine;