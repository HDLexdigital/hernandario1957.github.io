/**
 * E24.4.2 — ProvenanceLinkEngine (Motor de Enlaces de Procedencia)
 * 
 * - Extrae exclusivamente los campos canónicos del vínculo de procedencia (antecesor, sucesor, relación y etapa).
 * - Aplica ordenamiento recursivo de claves para garantizar serialización determinista independiente del orden JSON.
 * - Calcula firmas SHA-256 inmutables (provenanceHash) excluyendo explícitamente telemetría y metadatos de runtime.
 * - Opera mediante funciones puras con estricta inmutabilidad.
 */

'use strict';

const crypto = require('crypto');

class ProvenanceLinkEngine {
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
     * Extrae únicamente los campos canónicos del enlace de procedencia.
     * @param {Object} link - Enlace de procedencia crudo.
     * @returns {Object} Subconjunto canónico estructurado.
     */
    static extractCanonicalPayload(link) {
        if (!link || typeof link !== 'object') {
            throw new Error('PROVENANCE_LINK_VIOLATION: Objeto de enlace ausente o malformado.');
        }

        if (!link.previousArtifactHash || !link.currentArtifactHash || !link.relation || !link.stage) {
            throw new Error('PROVENANCE_LINK_VIOLATION: Faltan campos obligatorios en el enlace (previousArtifactHash, currentArtifactHash, relation, stage).');
        }

        return {
            previousArtifactHash: link.previousArtifactHash,
            currentArtifactHash: link.currentArtifactHash,
            relation: link.relation,
            stage: link.stage
        };
    }

    /**
     * Serializa el enlace en formato de cadena canónica JSON con claves ordenadas de forma estable.
     * @param {Object} link - Enlace.
     * @returns {string} Cadena canónica JSON.
     */
    static canonicalize(link) {
        const payload = this.extractCanonicalPayload(link);
        const sortedPayload = this._sortObjectKeys(payload);
        return JSON.stringify(sortedPayload);
    }

    /**
     * Calcula la identidad criptográfica (provenanceHash SHA-256) del enlace de procedencia.
     * @param {Object} link - Enlace.
     * @returns {Object} Objeto con la cadena canónica y su provenanceHash.
     */
    static computeLink(link) {
        const canonicalString = this.canonicalize(link);
        const provenanceHash = crypto.createHash('sha256').update(canonicalString).digest('hex');

        return {
            canonicalString: canonicalString,
            provenanceHash: provenanceHash
        };
    }
}

module.exports = ProvenanceLinkEngine;