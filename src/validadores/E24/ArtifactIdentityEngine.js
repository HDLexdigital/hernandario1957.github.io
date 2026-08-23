/**
 * E24.4.1 — ArtifactIdentityEngine (Motor de Identidad Canónica de Artefactos)
 * 
 * - Extrae exclusivamente los metadatos y payloads portadores de identidad del artefacto.
 * - Aplica ordenamiento recursivo de claves para garantizar serialización determinista independiente del orden JSON.
 * - Calcula firmas SHA-256 inmutables (contentHash) excluyendo explícitamente telemetría de runtime y executionIds.
 * - Opera mediante funciones puras, garantizando cero efectos colaterales sobre el objeto original.
 */

'use strict';

const crypto = require('crypto');

class ArtifactIdentityEngine {
    /**
     * Ordena recursivamente las propiedades de un objeto para asegurar serialización canónica estable.
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
     * Extrae únicamente los campos canónicos del artefacto, excluyendo telemetría volátil.
     * @param {Object} artifact - Artefacto original.
     * @returns {Object} Subconjunto canónico estructurado.
     */
    static extractCanonicalPayload(artifact) {
        if (!artifact || typeof artifact !== 'object') {
            throw new Error('ARTIFACT_IDENTITY_VIOLATION: Artefacto ausente o malformado.');
        }

        if (!artifact.artifactId || !artifact.artifactType || !artifact.jobIdentity) {
            throw new Error('ARTIFACT_IDENTITY_VIOLATION: Metadatos obligatorios de artefacto faltantes (artifactId, artifactType, jobIdentity).');
        }

        return {
            artifactId: artifact.artifactId,
            artifactType: artifact.artifactType,
            jobIdentity: artifact.jobIdentity,
            schemaVersion: artifact.schemaVersion || '1.0.0',
            payload: artifact.payload || {}
        };
    }

    /**
     * Serializa el artefacto en formato de cadena canónica JSON con claves ordenadas de forma estable.
     * @param {Object} artifact - Artefacto.
     * @returns {string} Cadena canónica JSON.
     */
    static canonicalize(artifact) {
        const payload = this.extractCanonicalPayload(artifact);
        const sortedPayload = this._sortObjectKeys(payload);
        return JSON.stringify(sortedPayload);
    }

    /**
     * Calcula la identidad criptográfica (contentHash SHA-256) del artefacto.
     * @param {Object} artifact - Artefacto.
     * @returns {Object} Objeto con la cadena canónica y su contentHash.
     */
    static computeIdentity(artifact) {
        const canonicalString = this.canonicalize(artifact);
        const contentHash = crypto.createHash('sha256').update(canonicalString).digest('hex');

        return {
            canonicalString: canonicalString,
            contentHash: contentHash
        };
    }
}

module.exports = ArtifactIdentityEngine;