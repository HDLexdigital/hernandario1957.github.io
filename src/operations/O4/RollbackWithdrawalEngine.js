/**
 * O4.6 — Rollback / Withdrawal Engine
 * 
 * - Retira o revoca una distribución de forma controlada sin destruir la historia forense ni los manifiestos.
 * - Garantiza los invariantes W1–W12 (Preservación histórica, autoridad obligatoria, idempotencia y no resurrección).
 */

'use strict';

const crypto = require('crypto');

class RollbackWithdrawalEngine {

    constructor() {
        this.withdrawalsStore = new Map(); // Almacén inmutable de registros de retirada (distributionId -> WithdrawalRecord)
    }

    /**
     * W1–W12: Ejecuta la retirada o rollback de una distribución verificada de forma atómica e inmutable
     */
    withdrawDistribution(verifiedDistributionRecord, manifestRecord, withdrawalAuth) {
        // W1. Valid Distribution Binding
        if (!verifiedDistributionRecord || verifiedDistributionRecord.status !== 'VERIFIED_DISTRIBUTION') {
            throw new Error('INVALID_DISTRIBUTION_BINDING: Only verified distributions can be withdrawn.');
        }

        // W7. Manifest Preservation Binding
        if (!manifestRecord || manifestRecord.distributionId !== verifiedDistributionRecord.distributionId) {
            throw new Error('MANIFEST_BINDING_FAILURE: Valid corresponding Distribution Manifest is mandatory.');
        }

        const distId = verifiedDistributionRecord.distributionId;

        // W8. Idempotent Withdrawal
        if (this.withdrawalsStore.has(distId)) {
            const existing = this.withdrawalsStore.get(distId);
            return Object.freeze({
                ...existing,
                idempotentRepeat: true,
                status: 'ALREADY_WITHDRAWN'
            });
        }

        // W3. Withdrawal Authorization
        if (!withdrawalAuth || withdrawalAuth.status !== 'AUTHORIZED_WITHDRAWAL') {
            throw new Error('WITHDRAWAL_AUTHORIZATION_REQUIRED: Explicit and valid withdrawal authorization is mandatory.');
        }

        // W4. Reason Mandatory
        if (!withdrawalAuth.reason || typeof withdrawalAuth.reason !== 'string' || withdrawalAuth.reason.trim() === '') {
            throw new Error('WITHDRAWAL_REASON_MANDATORY: A coded operational reason must accompany withdrawal.');
        }

        // W2. Identity Continuity & W10. Atomic State Transition
        const requestedAt = new Date().toISOString();
        const completedAt = new Date().toISOString();

        const canonicalRecord = {
            withdrawalId: `WTH_${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
            distributionId: distId,
            releaseId: manifestRecord.releaseId,
            jobIdentity: manifestRecord.productionIdentity.jobIdentity,
            executionId: manifestRecord.productionIdentity.executionId,
            manifestHash: manifestRecord.distributionManifestHash,
            integrityVerdictHash: verifiedDistributionRecord.integrityVerdictHash,
            authorizationId: withdrawalAuth.authorizationId,
            withdrawalReason: withdrawalAuth.reason.trim(),
            withdrawalStatus: 'WITHDRAWN'
        };

        // W12. Deterministic Withdrawal Verdict Hash
        const serialized = JSON.stringify(canonicalRecord, Object.keys(canonicalRecord).sort());
        const withdrawalVerdictHash = crypto.createHash('sha256').update(serialized).digest('hex');

        const sealedRecord = Object.freeze({
            ...canonicalRecord,
            requestedAt,
            completedAt,
            withdrawalVerdictHash
        });

        // W5, W6 & W7: Se persiste exclusivamente el registro de retirada sin mutar O1.1, E26.7 ni el Manifiesto original
        this.withdrawalsStore.set(distId, sealedRecord);

        return sealedRecord;
    }

    /**
     * Consulta el registro de retirada
     */
    lookupWithdrawal(distributionId) {
        if (!this.withdrawalsStore.has(distributionId)) {
            throw new Error(`WITHDRAWN_RECORD_NOT_FOUND: Distribution ${distributionId} has not been withdrawn.`);
        }
        return this.withdrawalsStore.get(distributionId);
    }
}

module.exports = RollbackWithdrawalEngine;