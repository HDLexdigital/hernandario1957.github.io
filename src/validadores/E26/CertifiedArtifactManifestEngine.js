/**
 * E26.2 — CertifiedArtifactManifestEngine
 * 
 * - Empaqueta y sella criptográficamente el inventario oficial de entregables de producción.
 * - Valida la vinculación estricta con el CertificationRecord (E26.1) y la homogeneidad de jobIdentity.
 * - Calcula un manifestHash canónico determinista y aplica inmutabilidad defensiva total (Object.freeze profundo).
 */

'use strict';

const crypto = require('crypto');

class CertifiedArtifactManifestEngine {

    /**
     * Crea un manifiesto certificado inmutable a partir del registro de idoneidad y el set de entregables.
     */
    static createManifest(certificationRecord, artifactSet) {
        // M1: Verificación de vinculación obligatoria con CertificationRecord válido
        if (!certificationRecord || certificationRecord.status !== 'PRODUCTION_CERTIFIED') {
            return { status: 'MANIFEST_REJECTED', reason: 'INVALID_CERTIFICATION_RECORD', timestamp: new Date().toISOString() };
        }

        // M3: Validación de inventario presente
        if (!Array.isArray(artifactSet) || artifactSet.length === 0) {
            return { status: 'MANIFEST_REJECTED', reason: 'MANIFEST_INCOMPLETE', timestamp: new Date().toISOString() };
        }

        const normalizedArtifacts = [];

        for (const item of artifactSet) {
            // M2: Homogeneidad de jobIdentity
            // M4 & M5: Integridad absoluta de atributos obligatorios y no certificados
            if (!item.artifactId || !item.artifactType || item.jobIdentity !== certificationRecord.jobIdentity || !item.contentHash || !item.provenanceHash) {
                return { status: 'MANIFEST_REJECTED', reason: 'INVALID_OR_UNCERTIFIED_ARTIFACT', timestamp: new Date().toISOString() };
            }

            normalizedArtifacts.push({
                artifactId: item.artifactId,
                artifactType: item.artifactType,
                jobIdentity: item.jobIdentity,
                contentHash: item.contentHash,
                provenanceHash: item.provenanceHash
            });
        }

        // M6 & M7: Cálculo de hash canónico de entrega (excluyendo runtime y timestamps)
        const canonicalPayload = {
            certificationHash: certificationRecord.certificationHash,
            jobIdentity: certificationRecord.jobIdentity,
            artifacts: normalizedArtifacts.sort((a, b) => a.artifactId.localeCompare(b.artifactId))
        };

        const canonicalString = JSON.stringify(canonicalPayload, Object.keys(canonicalPayload).sort());
        const manifestHash = crypto.createHash('sha256').update(canonicalString).digest('hex');

        // Construcción del Manifiesto Terminal (M9)
        const manifest = {
            status: 'CERTIFIED', // Estado terminal
            jobIdentity: certificationRecord.jobIdentity,
            certificationHash: certificationRecord.certificationHash,
            manifestHash: manifestHash,
            artifacts: normalizedArtifacts,
            issuedAt: new Date().toISOString()
        };

        // M8: Inmutabilidad defensiva total (Congelamiento recursivo de objetos y arrays)
        return this._deepFreeze(manifest);
    }

    /**
     * Helper privado para inmutabilidad defensiva profunda (Deep Freeze).
     */
    static _deepFreeze(obj) {
        Object.getOwnPropertyNames(obj).forEach(prop => {
            const val = obj[prop];
            if (val && (typeof val === 'object' || typeof val === 'function')) {
                this._deepFreeze(val);
            }
        });
        return Object.freeze(obj);
    }
}

module.exports = CertifiedArtifactManifestEngine;