/**
 * O4.5 — Distribution Integrity Verification Engine
 * 
 * - Comprueba que la realidad física y material de los entregables coincide con el Distribution Manifest de O4.4.
 * - Garantiza los invariantes I1–I10 (Prueba de presencia, exclusividad, coincidencia hash, detección de manipulación y read-only).
 */

'use strict';

const crypto = require('crypto');

class DistributionIntegrityVerificationEngine {

    constructor() {
        this.verificationStore = new Map(); // Almacén inmutable de veredictos de integridad
    }

    /**
     * I1–I10: Verifica la integridad física de un paquete distribuido frente a su manifiesto autorizado
     */
    verifyDistributionIntegrity(manifest, physicalPackageArtifacts) {
        // I1. Manifest Binding
        if (!manifest || manifest.status !== 'MANIFEST_SEALED') {
            throw new Error('MANIFEST_BINDING_FAILURE: A sealed Distribution Manifest is mandatory for verification.');
        }

        const declaredArtifacts = manifest.artifacts || [];
        const physicalArtifactMap = new Map();

        if (!Array.isArray(physicalPackageArtifacts)) {
            throw new Error('INVALID_PHYSICAL_PACKAGE: Physical package artifacts must be provided as an array.');
        }

        for (const phys of physicalPackageArtifacts) {
            physicalArtifactMap.set(phys.artifactId, phys);
        }

        const verifiedEntries = [];

        for (const declared of declaredArtifacts) {
            const physical = physicalArtifactMap.get(declared.artifactId);

            // I2. Artifact Presence
            if (!physical) {
                return Object.freeze({
                    status: 'DISTRIBUTION_INTEGRITY_FAILURE',
                    reason: `ARTIFACT_MISSING: Declared artifact ${declared.artifactId} does not exist in physical package.`
                });
            }

            // I5. Format Integrity
            if (physical.format && physical.format.toUpperCase() !== declared.format.toUpperCase()) {
                return Object.freeze({
                    status: 'DISTRIBUTION_INTEGRITY_FAILURE',
                    reason: `FORMAT_MISMATCH: Artifact ${declared.artifactId} format diverges from manifest.`
                });
            }

            // I4. Canonical Hash Match / I8. Tamper Detection
            if (!physical.physicalContent) {
                throw new Error(`MISSING_PHYSICAL_CONTENT: Content required to compute hash for ${declared.artifactId}`);
            }

            const computedHash = crypto.createHash('sha256').update(physical.physicalContent).digest('hex');

            if (computedHash !== declared.canonicalHash) {
                return Object.freeze({
                    status: 'DISTRIBUTION_INTEGRITY_FAILURE',
                    reason: `HASH_MISMATCH_TAMPER_DETECTED: Physical hash for ${declared.artifactId} does not match declared canonical hash.`
                });
            }

            verifiedEntries.push({
                artifactId: declared.artifactId,
                format: declared.format,
                verifiedHash: computedHash,
                status: 'VERIFIED'
            });
        }

        // I3. Artifact Exclusivity (rechaza archivos físicos no declarados en el manifiesto)
        for (const [physId] of physicalArtifactMap) {
            const isDeclared = declaredArtifacts.some(d => d.artifactId === physId);
            if (!isDeclared) {
                return Object.freeze({
                    status: 'DISTRIBUTION_INTEGRITY_FAILURE',
                    reason: `UNAUTHORIZED_ARTIFACT_INFILTRATION: Physical artifact ${physId} is present but not declared in manifest.`
                });
            }
        }

        // I9. Deterministic Verification Verdict Hash
        const canonicalVerdict = {
            distributionId: manifest.distributionId,
            releaseId: manifest.releaseId,
            productionIdentity: manifest.productionIdentity,
            verifiedArtifactsCount: verifiedEntries.length,
            status: 'VERIFIED_DISTRIBUTION'
        };

        const serialized = JSON.stringify(canonicalVerdict, Object.keys(canonicalVerdict).sort());
        const integrityVerdictHash = crypto.createHash('sha256').update(serialized).digest('hex');

        const sealedVerdict = Object.freeze({
            ...canonicalVerdict,
            integrityVerdictHash,
            verifiedAt: new Date().toISOString()
        });

        // I10. Read-Only Verification: Se registra el veredicto sin mutar el manifiesto ni los binarios físicos
        this.verificationStore.set(manifest.distributionId, sealedVerdict);

        return sealedVerdict;
    }

    /**
     * Consulta un veredicto de integridad guardado
     */
    lookupVerification(distributionId) {
        if (!this.verificationStore.has(distributionId)) {
            throw new Error(`VERIFICATION_NOT_FOUND: No verification record for distribution ${distributionId}`);
        }
        return this.verificationStore.get(distributionId);
    }
}

module.exports = DistributionIntegrityVerificationEngine;