/**
 * O4.4 — Distribution Manifest Engine
 * 
 * - Construye la declaración criptográfica de los entregables autorizados para distribución a partir de PRODUCTION.
 * - Garantiza los invariantes D1–D10 (Admisión exclusiva, normalización canónica, exclusión y sellado inmutable).
 */

'use strict';

const crypto = require('crypto');
const path = require('path');

class DistributionManifestEngine {

    constructor() {
        this.manifestsStore = new Map(); // Almacén inmutable de manifiestos sellados (distributionId -> Manifest)
    }

    /**
     * D1–D10: Construye y sella un Distribution Manifest a partir de un registro de producción válido
     */
    buildManifest(distributionId, productionRecord, candidatePayload) {
        if (!distributionId || typeof distributionId !== 'string') {
            throw new Error('INVALID_MANIFEST_INIT: distributionId is mandatory.');
        }

        // D8. Immutable Manifest: Prohibición de sobrescritura
        if (this.manifestsStore.has(distributionId)) {
            throw new Error(`MANIFEST_IMMUTABILITY_VIOLATION: Distribution manifest ${distributionId} already exists.`);
        }

        // D1. Production-Only Admission
        if (!productionRecord || productionRecord.promotionStatus !== 'PRODUCTION') {
            throw new Error('PRODUCTION_ONLY_ADMISSION: Only artifacts in PRODUCTION state can enter distribution manifest.');
        }

        // D2. Identity Binding & D6. Version / Release Binding
        if (!candidatePayload || candidatePayload.candidateId !== productionRecord.candidateId) {
            throw new Error('IDENTITY_OR_RELEASE_BINDING_FAILURE: Candidate metadata does not match production record.');
        }

        const rawArtifacts = candidatePayload.artifacts || [];
        // D3. Artifact Completeness
        if (rawArtifacts.length === 0) {
            throw new Error('ARTIFACT_COMPLETENESS_FAILURE: Manifest cannot be built without declared artifacts.');
        }

        const canonicalArtifacts = [];

        for (const art of rawArtifacts) {
            // D7. No Unauthorized Inclusion / D4. Format Declaration / D5. Hash Binding
            if (!art.artifactId || !art.format || !art.artifactHash || !art.certified) {
                throw new Error('UNAUTHORIZED_OR_MALFORMED_ARTIFACT: Uncertified, missing format, or malformed artifact rejected.');
            }

            // Normalización canónica de rutas (D9)
            const normalizedPath = path.posix.normalize(art.path || `dist/${art.artifactId}.${art.format.toLowerCase()}`);

            canonicalArtifacts.push({
                artifactId: art.artifactId,
                format: art.format.toUpperCase(),
                path: normalizedPath,
                canonicalHash: art.artifactHash,
                size: art.size || 1024
            });
        }

        // Ordenamiento canónico de artefactos para asegurar determinismo estricto (D9)
        canonicalArtifacts.sort((a, b) => a.artifactId.localeCompare(b.artifactId));

        // D10. Evidence Binding
        const manifestBody = {
            distributionId,
            releaseId: productionRecord.candidateId,
            productionIdentity: {
                jobIdentity: productionRecord.jobIdentity,
                executionId: productionRecord.executionId,
                candidateId: productionRecord.candidateId
            },
            artifacts: canonicalArtifacts,
            sourceCertificateHash: candidatePayload.certificationBinding,
            promotionVerdictHash: productionRecord.promotionVerdictHash,
            status: 'MANIFEST_VALIDATED'
        };

        // D9. Deterministic Canonicalization (distributionManifestHash)
        const serialized = JSON.stringify(manifestBody, Object.keys(manifestBody).sort());
        const distributionManifestHash = crypto.createHash('sha256').update(serialized).digest('hex');

        const sealedManifest = Object.freeze({
            ...manifestBody,
            distributionManifestHash,
            status: 'MANIFEST_SEALED',
            sealedAt: new Date().toISOString()
        });

        this.manifestsStore.set(distributionId, sealedManifest);
        return sealedManifest;
    }

    /**
     * Consulta un manifiesto de distribución sellado
     */
    lookupManifest(distributionId) {
        if (!this.manifestsStore.has(distributionId)) {
            throw new Error(`MANIFEST_NOT_FOUND: Manifest ${distributionId} does not exist.`);
        }
        return this.manifestsStore.get(distributionId);
    }
}

module.exports = DistributionManifestEngine;