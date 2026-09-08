/**
 * O4.1 — Release Candidate Assembly Engine
 * 
 * - Selecciona, verifica y ensambla artefactos previamente certificados (E26).
 * - Garantiza los invariantes R1–R8 (Certificación obligatoria, consistencia, binding y no emisión de autorización).
 */

'use strict';

const crypto = require('crypto');

class ReleaseCandidateAssemblyEngine {

    constructor() {
        this.candidatesStore = new Map(); // Almacén inmutable de release candidates sellados
    }

    /**
     * R1, R2, R3, R5, R6, R7, R8: Ensambla un Release Candidate a partir de artefactos certificados
     */
    assembleCandidate(candidateId, packagePayload) {
        if (!candidateId || typeof candidateId !== 'string') {
            throw new Error('INVALID_CANDIDATE_INIT: candidateId is mandatory.');
        }

        // R8. Immutable Candidate: Evita la sobreescritura de candidatos ya sellados
        if (this.candidatesStore.has(candidateId)) {
            throw new Error(`CANDIDATE_IMMUTABILITY_VIOLATION: Candidate ${candidateId} already exists and cannot be overwritten.`);
        }

        const { jobIdentity, executionId, artifacts = [], certificationMetadata } = packagePayload;

        // R2. Identity Consistency
        if (!jobIdentity || !executionId) {
            throw new Error('IDENTITY_CONSISTENCY_FAILURE: jobIdentity and executionId are mandatory.');
        }

        // R1. Certification Required
        if (!certificationMetadata || certificationMetadata.status !== 'CERTIFIED') {
            throw new Error('CERTIFICATION_REQUIRED: Artifacts must possess a valid E26 certification.');
        }

        // R3. Certificate Binding
        if (!certificationMetadata.certificateHash) {
            throw new Error('CERTIFICATE_BINDING_FAILURE: Missing cryptographic binding to E26.7 certificate.');
        }

        // R6. No Uncertified Artifacts / R5. Manifest Completeness
        if (!Array.isArray(artifacts) || artifacts.length === 0) {
            throw new Error('MANIFEST_COMPLETENESS_FAILURE: Candidate manifest cannot be empty.');
        }

        for (const art of artifacts) {
            if (!art.artifactId || !art.artifactHash || !art.certified) {
                throw new Error('UNCERTIFIED_ARTIFACT_DETECTED: All manifest items must be fully certified.');
            }
        }

        // Ordenamiento canónico de artefactos para asegurar determinismo
        const sortedArtifacts = [...artifacts].sort((a, b) => a.artifactId.localeCompare(b.artifactId));

        const candidateManifest = {
            candidateId,
            jobIdentity,
            executionId,
            artifacts: sortedArtifacts,
            certificationBinding: certificationMetadata.certificateHash,
            assembledAt: new Date().toISOString()
        };

        // R7. Deterministic Assembly (candidateHash canónico)
        const serialized = JSON.stringify(candidateManifest, Object.keys(candidateManifest).sort());
        const candidateHash = crypto.createHash('sha256').update(serialized).digest('hex');

        const sealedCandidate = Object.freeze({
            ...candidateManifest,
            candidateHash,
            status: 'CANDIDATE_READY' // R4: Nunca RELEASE_AUTHORIZED
        });

        this.candidatesStore.set(candidateId, sealedCandidate);
        return sealedCandidate;
    }

    /**
     * Consulta un candidato sellado
     */
    lookup(candidateId) {
        if (!this.candidatesStore.has(candidateId)) {
            throw new Error(`CANDIDATE_NOT_FOUND: No candidate found for ID ${candidateId}`);
        }
        return this.candidatesStore.get(candidateId);
    }
}

module.exports = ReleaseCandidateAssemblyEngine;