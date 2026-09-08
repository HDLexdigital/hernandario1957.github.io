/**
 * O4.3 — Production Promotion Engine
 * 
 * - Ejecuta la transición atómica e inmutable desde RELEASE_AUTHORIZED hacia PRODUCTION.
 * - Garantiza los invariantes P1–P10, generando evidencia soberana y prohibiendo duplicados o reparaciones en caliente.
 */

'use strict';

const crypto = require('crypto');

class ProductionPromotionEngine {

    constructor() {
        this.productionStore = new Map(); // Almacén aislado de registros de producción (candidateId -> ProductionRecord)
    }

    /**
     * P1–P10: Promueve un Release Candidate autorizado hacia el entorno de producción de forma atómica
     */
    promoteToProduction(candidate, authorizationRecord) {
        // P1. Candidate Eligibility
        if (!candidate || candidate.status !== 'CANDIDATE_READY') {
            throw new Error('INVALID_CANDIDATE_ELIGIBILITY: Candidate must be in CANDIDATE_READY state.');
        }

        // P2. Authorization Binding
        if (!authorizationRecord || authorizationRecord.status !== 'RELEASE_AUTHORIZED') {
            throw new Error('AUTHORIZATION_BINDING_FAILURE: Valid RELEASE_AUTHORIZED state is mandatory.');
        }

        if (authorizationRecord.candidateId !== candidate.candidateId) {
            throw new Error('AUTHORIZATION_MISMATCH: Authorization record does not match candidate ID.');
        }

        // P3. Certification Binding
        if (!candidate.certificationBinding) {
            throw new Error('CERTIFICATION_CHAIN_BROKEN: Candidate lacks E26.7 cryptographic certificate binding.');
        }

        // P8. No Duplicate Promotion
        if (this.productionStore.has(candidate.candidateId)) {
            throw new Error(`DUPLICATE_PROMOTION_VIOLATION: Candidate ${candidate.candidateId} has already been promoted to production.`);
        }

        // P4. Identity Continuity & P5. Artifact Completeness
        if (!candidate.jobIdentity || !candidate.executionId || !Array.isArray(candidate.artifacts) || candidate.artifacts.length === 0) {
            throw new Error('IDENTITY_OR_ARTIFACT_INCOMPLETE: Candidate metadata or artifact manifest is incomplete.');
        }

        // P6. Atomic Promotion: Preparación del bloque transaccional
        const promotionTimestamp = new Date().toISOString();

        // Generación de hash canónico de los artefactos promovidos
        const artifactManifestSerialized = JSON.stringify(candidate.artifacts, Object.keys(candidate.artifacts).sort());
        const promotedArtifactHash = crypto.createHash('sha256').update(artifactManifestSerialized).digest('hex');

        // P9. Promotion Evidence / P10. Deterministic Promotion Verdict Hash
        const canonicalRecord = {
            candidateId: candidate.candidateId,
            jobIdentity: candidate.jobIdentity,
            executionId: candidate.executionId,
            authorizationId: authorizationRecord.authorizationId || 'AUTH_VERIFIED',
            sourceManifestHash: candidate.candidateHash,
            promotedArtifactHash,
            destinationIdentity: 'PRODUCTION_ENVIRONMENT_DEFAULT',
            promotionStatus: 'PRODUCTION'
        };

        const serialized = JSON.stringify(canonicalRecord, Object.keys(canonicalRecord).sort());
        const promotionVerdictHash = crypto.createHash('sha256').update(serialized).digest('hex');

        const productionRecord = Object.freeze({
            ...canonicalRecord,
            promotionTimestamp,
            promotionVerdictHash
        });

        // P7. Destination Isolation: Persistencia aislada en el almacén de producción
        this.productionStore.set(candidate.candidateId, productionRecord);

        return productionRecord;
    }

    /**
     * Consulta el registro de producción de un candidato
     */
    lookupProductionRecord(candidateId) {
        if (!this.productionStore.has(candidateId)) {
            throw new Error(`PRODUCTION_RECORD_NOT_FOUND: Candidate ${candidateId} is not in production.`);
        }
        return this.productionStore.get(candidateId);
    }
}

module.exports = ProductionPromotionEngine;