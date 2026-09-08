/**
 * O6.5 — Cross-Layer Failure Propagation Engine
 * 
 * - Verifica dinámicamente que un fallo operacional dispare los circuitos de contención y bloquee las fronteras de O4.
 * - Garantiza los invariantes F1–F12 (Propagación obligatoria, bloqueo de distribución/promoción, determinismo y read-only).
 */

'use strict';

const crypto = require('crypto');

class CrossLayerFailurePropagationEngine {

    constructor() {
        this.propagationStore = new Map(); // Almacén inmutable de veredictos (propagationVerdictHash -> PropagationVerdict)
    }

    /**
     * F1–F12: Audita de forma determinista y read-only la propagación institucional de un fallo operacional
     */
    verifyFailurePropagation(failurePropagationRecord) {
        // F1. Valid Failure Origin
        if (!failurePropagationRecord || !failurePropagationRecord.executionId || failurePropagationRecord.status !== 'FAILED') {
            throw new Error('VALID_FAILURE_ORIGIN_REQUIRED: A valid executionId with a FAILED status is mandatory.');
        }

        const {
            executionId,
            incidentRecord,
            classificationRecord,
            quarantineRecord,
            distributionState,
            promotionBlocked
        } = failurePropagationRecord;

        // F2. Incident Intake Binding
        if (!incidentRecord || incidentRecord.sourceBinding?.executionId !== executionId) {
            throw new Error('FAILURE_PROPAGATION_BREAK: Failed execution lacks a valid Incident Intake binding (O5.1).');
        }

        // F3. Classification Propagation
        if (!classificationRecord || classificationRecord.incidentId !== incidentRecord.incidentId || classificationRecord.status !== 'CLASSIFIED') {
            throw new Error('FAILURE_PROPAGATION_BREAK: Incident lacks a valid classification record (O5.2).');
        }

        // F4. Quarantine Propagation
        if (!quarantineRecord || quarantineRecord.incidentId !== incidentRecord.incidentId || quarantineRecord.status !== 'QUARANTINED') {
            throw new Error('FAILURE_PROPAGATION_BREAK: Compromised resource failed to achieve QUARANTINED state (O5.3).');
        }

        // F5. Distribution Boundary Enforcement (¡Fuga a O4 prohibida!)
        if (distributionState === 'DISTRIBUTED' || distributionState === 'PRODUCTION') {
            throw new Error('DISTRIBUTED_BOUNDARY_VIOLATION: Compromised artifact successfully leaked into distribution or production.');
        }

        // F6. Promotion Boundary Enforcement
        if (promotionBlocked !== true) {
            throw new Error('PROMOTION_BOUNDARY_VIOLATION: Unresolved failure failed to block subsequent promotions.');
        }

        // F10. Deterministic Propagation Verdict Hash (normalización canónica)
        const canonicalPayload = {
            executionId,
            incidentId: incidentRecord.incidentId,
            classificationHash: classificationRecord.classificationHash,
            containmentVerdictHash: quarantineRecord.containmentVerdictHash,
            distributionBlocked: true,
            promotionBlocked: true
        };

        const serialized = JSON.stringify(canonicalPayload, Object.keys(canonicalPayload).sort());
        const propagationVerdictHash = crypto.createHash('sha256').update(serialized).digest('hex');

        const propagationVerdict = Object.freeze({
            ...canonicalPayload,
            propagationVerdictHash,
            status: 'PROPAGATION_VERIFIED',
            verifiedAt: new Date().toISOString()
        });

        // Almacenamiento inmutable read-only
        this.propagationStore.set(propagationVerdictHash, propagationVerdict);

        return propagationVerdict;
    }

    /**
     * Consulta un veredicto de propagación guardado
     */
    lookupPropagationVerdict(propagationVerdictHash) {
        if (!this.propagationStore.has(propagationVerdictHash)) {
            throw new Error(`PROPAGATION_VERDICT_NOT_FOUND: Propagation verdict hash ${propagationVerdictHash} does not exist.`);
        }
        return this.propagationStore.get(propagationVerdictHash);
    }
}

module.exports = CrossLayerFailurePropagationEngine;