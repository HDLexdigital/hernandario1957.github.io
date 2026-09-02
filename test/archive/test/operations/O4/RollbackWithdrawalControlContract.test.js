/**
 * O4.6 — Rollback / Withdrawal Control Contract Suite (W1–W12)
 */

'use strict';

const path = require('path');
const RollbackWithdrawalEngine = require(path.join(process.cwd(), 'src', 'operations', 'O4', 'RollbackWithdrawalEngine'));

describe('O4.6 — Rollback / Withdrawal Control Contract Suite (W1–W12)', () => {

    let rollbackEngine;
    let verifiedDist;
    let manifest;
    let validAuth;

    beforeEach(() => {
        rollbackEngine = new RollbackWithdrawalEngine();

        verifiedDist = Object.freeze({
            distributionId: 'DIST_2026_001',
            releaseId: 'RC_2026_001',
            integrityVerdictHash: 'sha256_integrity_verdict_hash',
            status: 'VERIFIED_DISTRIBUTION'
        });

        manifest = Object.freeze({
            distributionId: 'DIST_2026_001',
            releaseId: 'RC_2026_001',
            productionIdentity: { jobIdentity: 'JOB_01', executionId: 'EXEC_01', candidateId: 'RC_2026_001' },
            distributionManifestHash: 'sha256_manifest_hash',
            status: 'MANIFEST_SEALED'
        });

        validAuth = Object.freeze({
            authorizationId: 'AUTH_WITHDRAW_001',
            status: 'AUTHORIZED_WITHDRAWAL',
            reason: 'SECURITY_PATCH_REQUIRED_IMMEDIATE_WITHDRAWAL'
        });
    });

    test('W1, W2, W3, W4, W11 & W12. CAMINO VERDE: Ejecuta una retirada válida generando evidencia y veredicto determinista', () => {
        const record = rollbackEngine.withdrawDistribution(verifiedDist, manifest, validAuth);

        expect(record.withdrawalStatus).toBe('WITHDRAWN');
        expect(record.withdrawalVerdictHash).toBeDefined();
        expect(record.withdrawalReason).toBe('SECURITY_PATCH_REQUIRED_IMMEDIATE_WITHDRAWAL');
    });

    test('W4. REASON MANDATORY: Rechaza la retirada si no se especifica una causa operacional codificada', () => {
        const invalidAuth = { ...validAuth, reason: '   ' };

        expect(() => {
            rollbackEngine.withdrawDistribution(verifiedDist, manifest, invalidAuth);
        }).toThrow('WITHDRAWAL_REASON_MANDATORY');
    });

    test('W8. IDEMPOTENT WITHDRAWAL: Retirar dos veces la misma distribución maneja el estado sin ambigüedad', () => {
        const first = rollbackEngine.withdrawDistribution(verifiedDist, manifest, validAuth);
        const second = rollbackEngine.withdrawDistribution(verifiedDist, manifest, validAuth);

        expect(first.withdrawalVerdictHash).toBe(second.withdrawalVerdictHash);
        expect(second.idempotentRepeat).toBe(true);
        expect(second.status).toBe('ALREADY_WITHDRAWN');
    });

    test('W5, W6 & W7. HISTORICAL EVIDENCE PRESERVATION: La retirada no altera ni destruye el manifiesto original', () => {
        const manifestSnapshot = JSON.stringify(manifest);

        rollbackEngine.withdrawDistribution(verifiedDist, manifest, validAuth);

        const manifestAfter = JSON.stringify(manifest);
        expect(manifestAfter).toBe(manifestSnapshot);
    });
});