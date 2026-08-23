/**
 * E26.4 — ReleaseGateEngine
 * 
 * - Puerta de gobernanza y liberación (Release / Publication Gate).
 * - Evalúa la cadena de custodia completa (E26.1, E26.2, E26.3) y exige autorización explícita.
 * - Calcula un releaseDecisionHash canónico determinista y sella un veredicto terminal inmutable.
 */

'use strict';

const crypto = require('crypto');

class ReleaseGateEngine {

    /**
     * Evalúa si un conjunto certificado de artefactos y evidencias puede cruzar la frontera hacia RELEASE_AUTHORIZED.
     */
    static evaluateRelease(certificationRecord, artifactManifest, multiFormatCertification, releasePolicy) {
        // RG1 & RG3: Validación estricta de existencia y estados terminales en la cadena
        if (!certificationRecord || certificationRecord.status !== 'PRODUCTION_CERTIFIED' ||
            !artifactManifest || artifactManifest.status !== 'CERTIFIED' ||
            !multiFormatCertification || multiFormatCertification.status !== 'MULTI_FORMAT_CERTIFIED') {
            return { status: 'RELEASE_BLOCKED', reason: 'INVALID_CERTIFICATION_CHAIN', timestamp: new Date().toISOString() };
        }

        // RG2: Coherencia absoluta de identidades (jobIdentity y hashes cruzados)
        if (certificationRecord.jobIdentity !== artifactManifest.jobIdentity ||
            artifactManifest.manifestHash !== multiFormatCertification.manifestHash) {
            return { status: 'RELEASE_BLOCKED', reason: 'IDENTITY_CONSISTENCY_MISMATCH', timestamp: new Date().toISOString() };
        }

        // RG5: Exigencia de autorización política explícita (Técnico ≠ Político)
        if (!releasePolicy || releasePolicy.authorizationStatus !== 'AUTHORIZED') {
            return { status: 'RELEASE_BLOCKED', reason: 'EXPLICIT_AUTHORIZATION_REQUIRED', timestamp: new Date().toISOString() };
        }

        // RG6 & RG8: Cálculo de Hash Canónico de Decisión (Aislado de timestamps o telemetría)
        const canonicalPayload = {
            jobIdentity: certificationRecord.jobIdentity,
            certificationHash: certificationRecord.certificationHash,
            manifestHash: artifactManifest.manifestHash,
            multiFormatCertificationHash: multiFormatCertification.multiFormatCertificationHash,
            releasePolicyIdentity: releasePolicy.releasePolicyIdentity || 'DEFAULT_POLICY',
            authorizationStatus: releasePolicy.authorizationStatus
        };

        const canonicalString = JSON.stringify(canonicalPayload, Object.keys(canonicalPayload).sort());
        const releaseDecisionHash = crypto.createHash('sha256').update(canonicalString).digest('hex');

        // Veredicto Terminal Inmutable (RG3 & RG7)
        const decision = {
            status: 'RELEASE_AUTHORIZED',
            jobIdentity: certificationRecord.jobIdentity,
            releaseDecisionHash: releaseDecisionHash,
            evidenceReferences: {
                certificationHash: certificationRecord.certificationHash,
                manifestHash: artifactManifest.manifestHash,
                multiFormatCertificationHash: multiFormatCertification.multiFormatCertificationHash
            },
            issuedAt: new Date().toISOString()
        };

        return Object.freeze(decision);
    }
}

module.exports = ReleaseGateEngine;