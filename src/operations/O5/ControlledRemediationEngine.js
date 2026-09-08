/**
 * O5.5 — Controlled Remediation & Recertification Engine
 * 
 * - Autoriza y spawnea una nueva ejecución gobernada a partir de un dictamen forense válido (O5.4).
 * - Garantiza los invariantes M1–M12 (No hot repair, nueva identidad, linaje genealógico y no herencia de certificación).
 */

'use strict';

const crypto = require('crypto');

class ControlledRemediationEngine {

    constructor() {
        this.remediationsStore = new Map(); // Almacén inmutable de registros de remediación (newExecutionId -> RemediationRecord)
    }

    /**
     * M1–M12: Autoriza una recertificación limpia, generando un nuevo executionId con linaje explícito
     */
    triggerRemediation(incidentRecord, quarantineRecord, assessmentRecord, remediationAuth) {
        // M1. Valid Incident Binding
        if (!incidentRecord || !incidentRecord.incidentId) {
            throw new Error('INVALID_INCIDENT_BINDING: A valid incident record is mandatory.');
        }

        // M3. Quarantine Prerequisite
        if (!quarantineRecord || quarantineRecord.incidentId !== incidentRecord.incidentId || quarantineRecord.status !== 'QUARANTINED') {
            throw new Error('QUARANTINE_PREREQUISITE_VIOLATION: Incident must be in QUARANTINED state before remediation.');
        }

        // M2. Root-Cause Binding
        if (!assessmentRecord || assessmentRecord.incidentId !== incidentRecord.incidentId || assessmentRecord.status !== 'FORENSIC_ASSESSMENT_COMPLETE') {
            throw new Error('ROOT_CAUSE_BINDING_FAILURE: A valid Forensic Assessment record (O5.4) is mandatory.');
        }

        // Autorización explícita de remediación
        if (!remediationAuth || remediationAuth.status !== 'AUTHORIZED_REMEDIATION') {
            throw new Error('REMEDIATION_AUTHORIZATION_REQUIRED: Explicit and valid remediation authorization is mandatory.');
        }

        // M5. New Execution Identity & M6. Parent-Lineage Binding
        const parentExecutionId = incidentRecord.sourceBinding.executionId || 'EXEC_ORIGIN_UNKNOWN';
        const newExecutionId = `EXEC_REM_${crypto.bytesToHex ? crypto.bytesToHex(crypto.randomBytes(3)) : crypto.randomBytes(3).toString('hex').toUpperCase()}`;

        const canonicalRemediation = {
            remediationId: `REM_${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
            incidentId: incidentRecord.incidentId,
            parentExecutionId,
            newExecutionId,
            assessmentVerdictHash: assessmentRecord.assessmentVerdictHash,
            remediationState: 'NEW_EXECUTION_CREATED',
            initiatedAt: new Date().toISOString()
        };

        // M10. Deterministic Remediation Verdict Hash
        const serialized = JSON.stringify(canonicalRemediation, Object.keys(canonicalRemediation).sort());
        const remediationVerdictHash = crypto.createHash('sha256').update(serialized).digest('hex');

        const sealedRemediation = Object.freeze({
            ...canonicalRemediation,
            remediationVerdictHash,
            status: 'REMEDIATION_SPAWNED'
        });

        // M4 & M11 (No Hot Repair): La ejecución original jamás se muta; se registra un nuevo linaje
        this.remediationsStore.set(newExecutionId, sealedRemediation);

        return sealedRemediation;
    }

    /**
     * Consulta un registro de remediación por su nuevo executionId
     */
    lookupRemediation(newExecutionId) {
        if (!this.remediationsStore.has(newExecutionId)) {
            throw new Error(`REMEDIATION_RECORD_NOT_FOUND: No remediation record for execution ${newExecutionId}`);
        }
        return this.remediationsStore.get(newExecutionId);
    }
}

module.exports = ControlledRemediationEngine;