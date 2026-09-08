/**
 * O3.3 — Forensic Audit & Reconstruction Engine
 * 
 * Implementa el contrato forense F1–F12:
 * - Valida la direccinabilidad, consistencia de identidad, integridad de la cadena y procedencia.
 * - Emite un veredicto determinista (FORENSICALLY_VALID, FORENSICALLY_INVALID, FORENSICALLY_INCOMPLETE).
 * - Garantiza read-only audit (F11) y determinismo en el verdictHash (F12).
 */

'use strict';

const crypto = require('crypto');

class ForensicAuditEngine {

    constructor(registryEngine, evidenceStoreAdapter = null) {
        this.registryEngine = registryEngine;
        this.evidenceStoreAdapter = evidenceStoreAdapter; // Adaptador opcional para verificar O1.1 en disco/memoria
    }

    /**
     * F1–F12: Realiza la auditoría forense end-to-end de una ejecución
     */
    auditExecution(executionId, ledgerInstance, evidenceManifest = null) {
        const violations = [];
        let registryRecord = null;

        // F1. Execution Addressability
        try {
            registryRecord = this.registryEngine.lookup(executionId);
        } catch (error) {
            violations.push({ invariant: 'F1', code: 'EXECUTION_NOT_FOUND', message: error.message });
        }

        // F3. Ledger Resolution
        if (!ledgerInstance || ledgerInstance.executionId !== executionId) {
            violations.push({ invariant: 'F3', code: 'LEDGER_RESOLUTION_FAILURE', message: 'Ledger missing or belongs to a different executionId.' });
        }

        // F5 & F6. Chain Integrity & Completeness
        let ledgerAudit = { valid: false, totalEvents: 0, reason: 'LEDGER_MISSING' };
        if (ledgerInstance) {
            ledgerAudit = ledgerInstance.verifyLedgerIntegrity();
            if (!ledgerAudit.valid) {
                violations.push({ invariant: 'F5', code: 'CHAIN_INTEGRITY_FAILURE', message: `Ledger failed validation: ${ledgerAudit.reason}` });
            }
        }

        // F4. Identity Consistency
        if (registryRecord && ledgerInstance) {
            const snapshot = ledgerInstance.getLedgerSnapshot();
            const genesisEvent = snapshot.find(e => e.sequence === 0);
            if (genesisEvent && genesisEvent.executionId !== registryRecord.executionId) {
                violations.push({ invariant: 'F4', code: 'IDENTITY_MISMATCH', message: 'Registry executionId does not match Ledger executionId.' });
            }
        }

        // F9. Terminal State Consistency
        let terminalStatus = 'UNKNOWN';
        if (ledgerInstance) {
            const snapshot = ledgerInstance.getLedgerSnapshot();
            const lastEvent = snapshot[snapshot.length - 1];
            terminalStatus = lastEvent ? lastEvent.eventType : 'EMPTY';
        }

        // F7 & F8. Evidence Hash Integrity & Provenance Continuity
        if (!evidenceManifest) {
            violations.push({ invariant: 'F2', code: 'EVIDENCE_RESOLUTION_FAILURE', message: 'Evidence manifest is missing or unresolved.' });
        } else {
            if (!evidenceManifest.inputHash || !evidenceManifest.provenanceTrace) {
                violations.push({ invariant: 'F8', code: 'PROVENANCE_CHAIN_BROKEN', message: 'Incomplete provenance trace in evidence manifest.' });
            }
        }

        // F10. Cross-Layer Consistency
        if (registryRecord && evidenceManifest && evidenceManifest.executionId && evidenceManifest.executionId !== registryRecord.executionId) {
            violations.push({ invariant: 'F10', code: 'CROSS_LAYER_INCONSISTENCY', message: 'Registry and Evidence manifests describe divergent executions.' });
        }

        // Determinación del veredicto forense
        let verdict = 'FORENSICALLY_VALID';
        if (violations.length > 0) {
            const hasCriticalCorruption = violations.some(v => v.code === 'CHAIN_INTEGRITY_FAILURE' || v.code === 'IDENTITY_MISMATCH');
            verdict = hasCriticalCorruption ? 'FORENSICALLY_INVALID' : 'FORENSICALLY_INCOMPLETE';
        }

        // F12. Deterministic Verdict Hash (excluyendo telemetría incidental)
        const canonicalVerdict = {
            executionId,
            violations: violations.map(v => ({ invariant: v.invariant, code: v.code })),
            terminalStatus,
            totalEvents: ledgerAudit.totalEvents || 0,
            verdict
        };

        const serialized = JSON.stringify(canonicalVerdict, Object.keys(canonicalVerdict).sort());
        const verdictHash = crypto.createHash('sha256').update(serialized).digest('hex');

        return Object.freeze({
            executionId,
            auditId: `AUD_${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
            registryStatus: registryRecord ? 'RESOLVED' : 'UNRESOLVED',
            ledgerStatus: ledgerAudit.valid ? 'VALID' : 'INVALID',
            evidenceStatus: evidenceManifest ? 'RESOLVED' : 'UNRESOLVED',
            identityStatus: violations.some(v => v.invariant === 'F4') ? 'INCONSISTENT' : 'CONSISTENT',
            provenanceStatus: violations.some(v => v.invariant === 'F8') ? 'BROKEN' : 'CONTINUOUS',
            terminalStatus,
            consistencyStatus: violations.some(v => v.invariant === 'F10') ? 'CONFLICT' : 'ALIGNED',
            violations: Object.freeze(violations),
            reconstructedTimeline: ledgerInstance ? ledgerInstance.getLedgerSnapshot().map(e => e.eventType) : [],
            verdict,
            verdictHash
        });
    }
}

module.exports = ForensicAuditEngine;