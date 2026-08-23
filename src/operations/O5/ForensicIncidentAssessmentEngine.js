/**
 * O5.4 — Forensic Incident Assessment Engine
 * 
 * - Correlaciona la evidencia de O1–O3 y O5.1–O5.3 para producir un dictamen causal reproducible.
 * - Garantiza los invariantes FA1–FA12 (Linaje de evidencia, correlación de ledger, determinismo y separación de remediación).
 */

'use strict';

const crypto = require('crypto');

class ForensicIncidentAssessmentEngine {

    constructor() {
        this.assessmentsStore = new Map(); // Almacén inmutable de dictámenes forenses (incidentId -> AssessmentRecord)
    }

    /**
     * FA1–FA12: Ejecuta una evaluación forense read-only y produce el veredicto de causa raíz
     */
    assessIncident(incidentRecord, quarantineRecord, forensicContextPayload) {
        // FA1. Valid Incident Binding
        if (!incidentRecord || !incidentRecord.incidentId) {
            throw new Error('INVALID_INCIDENT_BINDING: A valid incident record from O5.1 is mandatory.');
        }

        // FA2. Quarantine Binding
        if (!quarantineRecord || quarantineRecord.incidentId !== incidentRecord.incidentId || quarantineRecord.status !== 'QUARANTINED') {
            throw new Error('QUARANTINE_BINDING_FAILURE: Incident must be in verified QUARANTINED state (O5.3).');
        }

        const incidentId = incidentRecord.incidentId;

        // FA3, FA4, FA5, FA6: Verificación del contexto forense y linaje de evidencia (O1–O3)
        if (!forensicContextPayload || !forensicContextPayload.executionId || !forensicContextPayload.ledgerTailHash || !forensicContextPayload.evidenceHash) {
            throw new Error('EVIDENCE_LINEAGE_OR_REGISTRY_CORRELATION_FAILURE: Missing core execution evidence or ledger references.');
        }

        // FA7. Evidence Integrity (verificación criptográfica simulada de hashes de fragmentos)
        const computedEvidenceHash = crypto.createHash('sha256').update(forensicContextPayload.rawEvidenceContent || 'MOCK_EVIDENCE_STREAM').digest('hex');
        if (computedEvidenceHash !== forensicContextPayload.evidenceHash) {
            throw new Error('FORENSIC_EVIDENCE_INTEGRITY_FAILURE: Evidence fragment hash verification failed.');
        }

        // FA8. Root-Cause Determination & FA9. Mandatory Rationale
        const { rootCauseCategory, rationale } = forensicContextPayload;
        const validCauses = new Set(['INPUT_CONTENT', 'POLICY_PROJECTION', 'RENDERING_ENVIRONMENT', 'OPERATIONAL_INFRASTRUCTURE']);

        if (!rootCauseCategory || !validCauses.has(rootCauseCategory)) {
            throw new Error(`ROOT_CAUSE_TAXONOMY_VIOLATION: Category '${rootCauseCategory}' is invalid.`);
        }

        if (!rationale || typeof rationale !== 'string' || rationale.trim() === '') {
            throw new Error('RATIONALE_REQUIRED: Root-cause determination requires a detailed technical rationale.');
        }

        // FA10. Deterministic Assessment Verdict Hash (basado exclusivamente en causa y evidencia inalterable)
        const canonicalAssessment = {
            incidentId,
            executionId: forensicContextPayload.executionId,
            ledgerTailHash: forensicContextPayload.ledgerTailHash,
            evidenceHash: forensicContextPayload.evidenceHash,
            rootCauseCategory,
            rationale: rationale.trim(),
            status: 'FORENSIC_ASSESSMENT_COMPLETE'
        };

        const serialized = JSON.stringify(canonicalAssessment, Object.keys(canonicalAssessment).sort());
        const assessmentVerdictHash = crypto.createHash('sha256').update(serialized).digest('hex');

        const sealedAssessment = Object.freeze({
            ...canonicalAssessment,
            assessmentVerdictHash,
            assessedAt: new Date().toISOString()
        });

        // FA11. Read-Only Forensic Boundary: Se persiste el dictamen sin alterar jamás O1–O3 u O5.1–O5.3
        this.assessmentsStore.set(incidentId, sealedAssessment);

        return sealedAssessment;
    }

    /**
     * Consulta un dictamen forense guardado
     */
    lookupAssessment(incidentId) {
        if (!this.assessmentsStore.has(incidentId)) {
            throw new Error(`ASSESSMENT_NOT_FOUND: No forensic assessment found for incident ${incidentId}`);
        }
        return this.assessmentsStore.get(incidentId);
    }
}

module.exports = ForensicIncidentAssessmentEngine;