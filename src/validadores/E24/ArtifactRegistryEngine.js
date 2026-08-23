/**
 * E24.4.3 — ArtifactRegistryEngine (Motor de Registro de Artefactos In-Memory & Append-Only)
 * 
 * - Administra un repositorio lógico estructurado en memoria agrupado por jobIdentity.
 * - Aplica el principio append-only: impide sobrescribir registros y ofrece idéntica idempotencia ante replays.
 * - Rechaza conflictos de identidad si un mismo ID presenta payload semántico diferente.
 * - Valida la integridad referencial de los enlaces de procedencia (ProvenanceLink).
 * - Garantiza inmutabilidad externa mediante clonación defensiva profunda.
 */

'use strict';

const ArtifactIdentityEngine = require('./ArtifactIdentityEngine');
const ProvenanceLinkEngine = require('./ProvenanceLinkEngine');

class ArtifactRegistryEngine {
    constructor() {
        // Estructura lógica en memoria: jobIdentity -> { artifacts: Map(artifactId -> record), hashes: Set(contentHash), provenanceLinks: Array }
        this._registry = new Map();
    }

    /**
     * Obtiene o inicializa el espacio de almacenamiento lógico para un jobIdentity.
     * @private
     */
    _getJobStore(jobIdentity) {
        if (!this._registry.has(jobIdentity)) {
            this._registry.set(jobIdentity, {
                artifacts: new Map(),
                hashes: new Set(),
                provenanceLinks: []
            });
        }
        return this._registry.get(jobIdentity);
    }

    /**
     * Registra un artefacto de manera append-only en el espacio del job correspondiente.
     * @param {Object} artifact - Artefacto certificado.
     * @returns {Object} Resultado del registro.
     */
    registerArtifact(artifact) {
        if (!artifact || !artifact.jobIdentity || !artifact.artifactId) {
            throw new Error('ARTIFACT_REGISTRY_VIOLATION: Artefacto malformado o sin jobIdentity/artifactId.');
        }

        const jobIdentity = artifact.jobIdentity;
        const artifactId = artifact.artifactId;
        const store = this._getJobStore(jobIdentity);

        const identityResult = ArtifactIdentityEngine.computeIdentity(artifact);
        const contentHash = identityResult.contentHash;

        // Comprobación de existencia del artifactId
        if (store.artifacts.has(artifactId)) {
            const existing = store.artifacts.get(artifactId);
            if (existing.contentHash === contentHash) {
                // Idempotencia: Mismo artefacto exacto (Replay autorizado)
                return { status: 'ALREADY_REGISTERED', contentHash };
            } else {
                // Conflicto de identidad: Mismo ID con contenido diferente
                throw new Error(`ARTIFACT_REGISTRY_VIOLATION: CONFLICT_DETECTED - El artifactId '${artifactId}' ya está registrado con un contenido semántico diferente.`);
            }
        }

        // Almacenamiento append-only con clonación defensiva
        const registeredRecord = JSON.parse(JSON.stringify({
            ...artifact,
            contentHash,
            registeredAt: new Date().toISOString()
        }));

        store.artifacts.set(artifactId, registeredRecord);
        store.hashes.add(contentHash);

        return {
            status: 'REGISTERED',
            artifactId,
            contentHash
        };
    }

    /**
     * Registra un enlace de procedencia validando que los artefactos referenciados existan en el job.
     * @param {string} jobIdentity - Identidad canónica del job.
     * @param {Object} linkData - Datos del enlace de procedencia.
     * @returns {Object} Resultado del registro de procedencia.
     */
    registerProvenance(jobIdentity, linkData) {
        if (!jobIdentity || !linkData) {
            throw new Error('ARTIFACT_REGISTRY_VIOLATION: jobIdentity o linkData ausente para registrar procedencia.');
        }

        const store = this._getJobStore(jobIdentity);
        const computedLink = ProvenanceLinkEngine.computeLink(linkData);

        const prevHash = linkData.previousArtifactHash;
        const currHash = linkData.currentArtifactHash;

        // Integridad referencial: los hashes antecesor y sucesor deben existir en el store del job
        if (!store.hashes.has(prevHash) || !store.hashes.has(currHash)) {
            throw new Error('ARTIFACT_REGISTRY_VIOLATION: PROVENANCE_INTEGRITY_FAILURE - Los artefactos antecesor y/o sucesor referenciados por el enlace no existen en el registro de este job.');
        }

        const provenanceRecord = JSON.parse(JSON.stringify({
            ...linkData,
            provenanceHash: computedLink.provenanceHash,
            registeredAt: new Date().toISOString()
        }));

        store.provenanceLinks.push(provenanceRecord);

        return {
            status: 'PROVENANCE_REGISTERED',
            provenanceHash: computedLink.provenanceHash
        };
    }

    /**
     * Consulta un artefacto específico protegiendo contra mutaciones externas.
     * @param {string} jobIdentity 
     * @param {string} artifactId 
     * @returns {Object|null} Copia profunda del artefacto o null.
     */
    getArtifact(jobIdentity, artifactId) {
        const store = this._registry.get(jobIdentity);
        if (!store || !store.artifacts.has(artifactId)) {
            return null;
        }
        return JSON.parse(JSON.stringify(store.artifacts.get(artifactId)));
    }

    /**
     * Verifica la existencia de un artefacto en el registro.
     * @param {string} jobIdentity 
     * @param {string} artifactId 
     * @returns {boolean}
     */
    hasArtifact(jobIdentity, artifactId) {
        const store = this._registry.get(jobIdentity);
        return !!store && store.artifacts.has(artifactId);
    }

    /**
     * Lista todos los artefactos registrados para un jobIdentity.
     * @param {string} jobIdentity 
     * @returns {Array} Arreglo con copias profundas de los artefactos.
     */
    listArtifacts(jobIdentity) {
        const store = this._registry.get(jobIdentity);
        if (!store) return [];
        return Array.from(store.artifacts.values()).map(art => JSON.parse(JSON.stringify(art)));
    }

    /**
     * Obtiene los enlaces de procedencia registrados para un jobIdentity.
     * @param {string} jobIdentity 
     * @returns {Array} Arreglo con copias profundas de los enlaces.
     */
    getProvenance(jobIdentity) {
        const store = this._registry.get(jobIdentity);
        if (!store) return [];
        return JSON.parse(JSON.stringify(store.provenanceLinks));
    }
}

module.exports = ArtifactRegistryEngine;