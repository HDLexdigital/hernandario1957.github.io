/**
 * O6.6 — Systemic Certification & Governance Engine
 * 
 * - Compone los 5 dictámenes transversales de O6 (O6.1–O6.5) en un Veredicto Sistémico Global (SystemicVerdict).
 * - Garantiza los invariantes SC1–SC12 (Composición pura, compatibilidad cruzada, determinismo y read-only).
 */

'use strict';

const crypto = require('crypto');

class SystemicCertificationGovernanceEngine {

    constructor() {
        this.systemicStore = new Map(); // Almacén inmutable de certificados sistémicos (systemicVerdictHash -> SystemicVerdict)
    }

    /**
     * SC1–SC12: Compone los veredictos de O6.1–O6.5 de manera determinista, resistente a conflictos y read-only
     */
    certifySystemicState(executionId, identityVerdict, lineageVerdict, stateVerdict, graphVerdict, propagationVerdict) {
        // SC1. Valid Systemic Binding
        if (!executionId || typeof executionId !== 'string') {
            throw new Error('VALID_SYSTEMIC_BINDING_REQUIRED: executionId is mandatory.');
        }

        // SC2. Complete O6 Verdict Set
        if (!identityVerdict || !lineageVerdict || !stateVerdict || !graphVerdict || !propagationVerdict) {
            throw new Error('COMPLETE_O6_VERDICT_SET_REQUIRED: All 5 cross-layer O6 verdicts (O6.1–O6.5) are mandatory.');
        }

        // SC3, SC4, SC5, SC6, SC7, SC8 & SC9. Common Genealogical Identity & Cross-Verifier Compatibility
        if (
            identityVerdict.executionId !== executionId ||
            lineageVerdict.executionId !== executionId ||
            stateVerdict.executionId !== executionId ||
            propagationVerdict.executionId !== executionId
        ) {
            throw new Error('SYSTEMIC_INTEGRITY_CONFLICT: Cross-verifier genealogical identity mismatch detected across O6 components.');
        }

        // Comprobación cruzada de estado de los sub-veredictos
        if (
            identityVerdict.status !== 'IDENTITY_VALIDATED' ||
            lineageVerdict.status !== 'HASH_LINEAGE_VALID' ||
            stateVerdict.status !== 'LIFECYCLE_CONSISTENT' ||
            graphVerdict.status !== 'EVIDENCE_GRAPH_CONSISTENT' ||
            propagationVerdict.status !== 'PROPAGATION_VERIFIED'
        ) {
            throw new Error('SYSTEMIC_VERDICT_FAILURE: One or more underlying O6 component verdicts did not pass validation.');
        }

        // Construcción del payload canónico de composición pura (SC10. Systemic Determinism)
        const canonicalSystemicPayload = {
            executionId,
            identityVerdictHash: identityVerdict.identityVerdictHash,
            lineageVerdictHash: lineageVerdict.lineageVerdictHash,
            stateVerdictHash: stateVerdict.stateVerdictHash,
            graphVerdictHash: graphVerdict.graphVerdictHash,
            propagationVerdictHash: propagationVerdict.propagationVerdictHash,
            systemicState: 'SYSTEMIC_CERTIFIED'
        };

        const serialized = JSON.stringify(canonicalSystemicPayload, Object.keys(canonicalSystemicPayload).sort());
        const systemicVerdictHash = crypto.createHash('sha256').update(serialized).digest('hex');

        // SC11. Systemic Verdict Idempotency
        if (this.systemicStore.has(executionId)) {
            const existing = this.systemicStore.get(executionId);
            if (existing.systemicVerdictHash !== systemicVerdictHash) {
                throw new Error('SYSTEMIC_INTEGRITY_CONFLICT: Existing systemic certificate exhibits diverging verdicts or payload.');
            }
            return Object.freeze({
                ...existing,
                idempotentRepeat: true,
                status: 'SYSTEMIC_CERTIFIED'
            });
        }

        const systemicCertificate = Object.freeze({
            ...canonicalSystemicPayload,
            systemicVerdictHash,
            certifiedAt: new Date().toISOString(), // Metadata operacional separada del hash canónico (SC10)
            status: 'SYSTEMIC_CERTIFIED'
        });

        // SC12. Read-Only Historical Boundary: Se almacena el dictamen sin mutar jamás O1–O6.5
        this.systemicStore.set(executionId, systemicCertificate);

        return systemicCertificate;
    }

    /**
     * Consulta un certificado sistémico guardado
     */
    lookupSystemicCertificate(executionId) {
        if (!this.systemicStore.has(executionId)) {
            throw new Error(`SYSTEMIC_CERTIFICATE_NOT_FOUND: Systemic certificate for execution ${executionId} does not exist.`);
        }
        return this.systemicStore.get(executionId);
    }
}

module.exports = SystemicCertificationGovernanceEngine;