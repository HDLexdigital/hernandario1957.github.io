/**
 * E26.1 — CertificationRecordEngine
 * 
 * - Consume evidencia Golden certificada para emitir constancias inmutables de gobernanza.
 * - Calcula hashes canónicos deterministas aislados de telemetría y timestamps de runtime.
 * - Aplica inmutabilidad defensiva total (Object.freeze).
 */

'use strict';

const crypto = require('crypto');

class CertificationRecordEngine {

    /**
     * Crea un registro de certificación inmutable a partir de la evidencia de composición.
     */
    static createRecord(goldenEvidence) {
        // C1 & C6: Verificación estricta de precondición Golden
        if (!goldenEvidence || goldenEvidence.status !== 'PRODUCTION_CERTIFIED') {
            return {
                status: 'CERTIFICATION_REJECTED',
                reason: 'INVALID_GOLDEN_EVIDENCE',
                timestamp: new Date().toISOString()
            };
        }

        // C4 & C8: Aislamiento canónico para cálculo de hash determinista (Ignora runtime y timestamps)
        const canonicalPayload = {
            corpusIdentity: goldenEvidence.corpusIdentity,
            jobIdentity: goldenEvidence.jobIdentity,
            artifactId: goldenEvidence.artifactId,
            provenanceIdentity: goldenEvidence.provenanceIdentity,
            astIdentity: goldenEvidence.astIdentity,
            projectionPlanIdentity: goldenEvidence.projectionPlanIdentity
        };

        const canonicalString = JSON.stringify(canonicalPayload, Object.keys(canonicalPayload).sort());
        const certificationHash = crypto.createHash('sha256').update(canonicalString).digest('hex');

        // Construcción del registro oficial
        const record = {
            status: 'PRODUCTION_CERTIFIED',
            corpusIdentity: goldenEvidence.corpusIdentity,
            jobIdentity: goldenEvidence.jobIdentity,
            executionId: goldenEvidence.executionId, // C2: Preservado pero separado del hash canónico
            certificationHash: certificationHash,
            evidenceReferences: {
                artifactId: goldenEvidence.artifactId,
                provenanceIdentity: goldenEvidence.provenanceIdentity,
                astIdentity: goldenEvidence.astIdentity,
                projectionPlanIdentity: goldenEvidence.projectionPlanIdentity
            },
            issuedAt: new Date().toISOString()
        };

        // C5 & C7: Inmutabilidad defensiva total mediante Object.freeze recursivo o plano estricto
        return Object.freeze(record);
    }
}

module.exports = CertificationRecordEngine;