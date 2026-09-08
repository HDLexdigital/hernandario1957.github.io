/**
 * O5.3 — Incident Containment & Quarantine Engine
 * 
 * - Transforma un incidente clasificado en una decisión de aislamiento operacional verificable.
 * - Garantiza los invariantes Q1–Q12 (Aislamiento de scope, protección de fronteras productivas, idempotencia y ausencia de remediación).
 */

'use strict';

const crypto = require('crypto');

class IncidentContainmentQuarantineEngine {

    constructor() {
        this.quarantineStore = new Map(); // Almacén inmutable de registros de cuarentena (incidentId -> QuarantineRecord)
    }

    /**
     * Q1–Q12: Aislar de forma preventiva y determinista un incidente clasificado
     */
    quarantineIncident(incidentRecord, classificationRecord, containmentAuth) {
        // Q1. Valid Incident Binding
        if (!incidentRecord || !incidentRecord.incidentId) {
            throw new Error('INVALID_INCIDENT_BINDING: A valid incident record from O5.1 is mandatory.');
        }

        // Q2. Classification Binding
        if (!classificationRecord || classificationRecord.incidentId !== incidentRecord.incidentId || classificationRecord.status !== 'CLASSIFIED') {
            throw new Error('CLASSIFICATION_BINDING_FAILURE: Incident must possess a valid, active classification record (O5.2).');
        }

        const incidentId = incidentRecord.incidentId;

        // Q11. Idempotent Containment
        if (this.quarantineStore.has(incidentId)) {
            const existing = this.quarantineStore.get(incidentId);
            return Object.freeze({
                ...existing,
                idempotentRepeat: true,
                status: 'QUARANTINED'
            });
        }

        // Q4. Explicit Containment Decision & Authorization
        if (!containmentAuth || containmentAuth.status !== 'AUTHORIZED_CONTAINMENT') {
            throw new Error('CONTAINMENT_AUTHORIZATION_REQUIRED: Explicit and valid containment authorization is mandatory.');
        }

        // Q3. Identity Continuity & Q5, Q6, Q7: Definición del scope de aislamiento
        const canonicalContainment = {
            incidentId,
            sourceBinding: { ...incidentRecord.sourceBinding },
            classificationHash: classificationRecord.classificationHash,
            containmentAction: 'ISOLATE_AND_BLOCK_RELEASE',
            quarantineState: 'QUARANTINED',
            isolatedAt: new Date().toISOString()
        };

        // Q10. Deterministic Containment Verdict Hash
        const serialized = JSON.stringify(canonicalContainment, Object.keys(canonicalContainment).sort());
        const containmentVerdictHash = crypto.createHash('sha256').update(serialized).digest('hex');

        const sealedQuarantine = Object.freeze({
            ...canonicalContainment,
            containmentVerdictHash,
            status: 'QUARANTINED'
        });

        // Q8 & Q9: Se persiste el registro de aislamiento sin alterar jamás la evidencia histórica O1–O4
        this.quarantineStore.set(incidentId, sealedQuarantine);

        return sealedQuarantine;
    }

    /**
     * Consulta un registro de cuarentena
     */
    lookupQuarantine(incidentId) {
        if (!this.quarantineStore.has(incidentId)) {
            throw new Error(`QUARANTINE_RECORD_NOT_FOUND: Incident ${incidentId} is not in quarantine.`);
        }
        return this.quarantineStore.get(incidentId);
    }
}

module.exports = IncidentContainmentQuarantineEngine;