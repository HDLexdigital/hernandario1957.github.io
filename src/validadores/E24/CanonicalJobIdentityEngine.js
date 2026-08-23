/**
 * E24.2 — CanonicalJobIdentityEngine (Motor de Identidad Canónica y Replay)
 * 
 * - Extrae exclusivamente los campos con valor de identidad de un EditorialJob (excluyendo runtime).
 * - Ordena recursivamente las propiedades para garantizar serialización determinista independiente del orden de claves.
 * - Calcula firmas SHA-256 inmutables para auditoría y Replay.
 * - Opera mediante funciones puras, garantizando cero efectos colaterales sobre el objeto original.
 */

'use strict';

const crypto = require('crypto');

class CanonicalJobIdentityEngine {
    /**
     * Ordena recursivamente las propiedades de un objeto para asegurar una serialización canónica estable.
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
     * Extrae únicamente los campos portadores de identidad del job, ignorando telemetría de runtime.
     * @param {Object} job - EditorialJob original.
     * @returns {Object} Subconjunto canónico estructurado.
     */
    static extractCanonicalPayload(job) {
        if (!job || typeof job !== 'object') {
            throw new Error('CANONICAL_IDENTITY_VIOLATION: Job inválido para extracción canónica.');
        }

        // Selección estricta de campos contractuales de E24.1 (excluyendo runtimeTelemetry u otros)
        return {
            jobContractVersion: job.jobContractVersion,
            identity: {
                jobId: job.identity && job.identity.jobId,
                jobVersion: job.identity && job.identity.jobVersion,
                createdBy: job.identity && job.identity.createdBy
            },
            source: {
                stage: job.source && job.source.stage,
                artifact: job.source && job.source.artifact,
                sha256: job.source && job.source.sha256
            },
            projection: {
                stage: job.projection && job.projection.stage,
                artifact: job.projection && job.projection.artifact,
                projectionVersion: job.projection && job.projection.projectionVersion,
                sha256: job.projection && job.projection.sha256
            },
            target: {
                type: job.target && job.target.type,
                profile: job.target && job.target.profile
            },
            policy: {
                executionMode: job.policy && job.policy.executionMode,
                transactionPolicy: job.policy && job.policy.transactionPolicy,
                failurePolicy: job.policy && job.policy.failurePolicy,
                retryPolicy: job.policy && job.policy.retryPolicy
            },
            expected: {
                nodeCount: job.expected && job.expected.nodeCount,
                operationCount: job.expected && job.expected.operationCount,
                unknownIds: job.expected && job.expected.unknownIds,
                orphanNodes: job.expected && job.expected.orphanNodes,
                duplicateNodes: job.expected && job.expected.duplicateNodes
            },
            provenance: {
                pipelineVersion: job.provenance && job.provenance.pipelineVersion,
                parentStages: job.provenance && job.provenance.parentStages
            }
        };
    }

    /**
     * Serializa el job en formato de cadena canónica JSON con claves ordenadas de forma estable.
     * @param {Object} job - EditorialJob.
     * @returns {string} Cadena canónica JSON.
     */
    static canonicalize(job) {
        const payload = this.extractCanonicalPayload(job);
        const sortedPayload = this._sortObjectKeys(payload);
        return JSON.stringify(sortedPayload);
    }

    /**
     * Calcula la identidad criptográfica (SHA-256) del job a partir de su representación canónica.
     * @param {Object} job - EditorialJob.
     * @returns {Object} Objeto con la cadena canónica y su jobIdentity hash.
     */
    static computeIdentity(job) {
        const canonicalString = this.canonicalize(job);
        const jobIdentity = crypto.createHash('sha256').update(canonicalString).digest('hex');

        return {
            canonicalJobString: canonicalString,
            jobIdentity: jobIdentity
        };
    }

    /**
     * Verifica la validez de un Replay comparando la identidad almacenada frente a la recalculada.
     * @param {Object} job - EditorialJob recuperado.
     * @param {string} storedIdentity - Identidad SHA-256 previamente registrada.
     * @returns {Object} Resultado de verificación de replay.
     */
    static verifyReplay(job, storedIdentity) {
        const computed = this.computeIdentity(job);
        const isValid = computed.jobIdentity === storedIdentity;

        if (!isValid) {
            throw new Error(`REPLAY_VIOLATION: La identidad recalculada (${computed.jobIdentity}) no coincide con la identidad almacenada (${storedIdentity}).`);
        }

        return {
            valid: true,
            storedIdentity: storedIdentity,
            recomputedIdentity: computed.jobIdentity
        };
    }
}

module.exports = CanonicalJobIdentityEngine;