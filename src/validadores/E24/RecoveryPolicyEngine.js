/**
 * E24.3.1 — RecoveryPolicyEngine (Motor de Políticas de Recuperación)
 * 
 * - Evalúa el estado de ejecución frente a los invariantes del EditorialJob.
 * - Aplica de forma intransigente la política NO_PARTIAL_COMMIT (prohibición total de commits ante anomalías).
 * - Clasifica las clases de fallo (VALIDATION_FAILURE, EXECUTION_FAILURE, ROUNDTRIP_FAILURE, COMMIT_FAILURE).
 * - Administra la separación entre el jobIdentity inmutable y el executionId de la instancia.
 */

'use strict';

const crypto = require('crypto');
const CanonicalJobIdentityEngine = require('./CanonicalJobIdentityEngine');

class RecoveryPolicyEngine {
    /**
     * Crea una instancia de ejecución aislada vinculada al job inmutable mediante su identidad canónica.
     * @param {Object} job - EditorialJob original.
     * @param {Object} options - Opciones de instancia ({ attempt }).
     * @returns {Object} ExecutionInstance.
     */
    static createExecutionInstance(job, options = {}) {
        const jobIdentityResult = CanonicalJobIdentityEngine.computeIdentity(job);
        const attempt = options.attempt || 1;
        const executionSalt = `${jobIdentityResult.jobIdentity}_ATTEMPT_${attempt}_${Date.now()}`;
        const executionId = `EXEC-${crypto.createHash('sha256').update(executionSalt).digest('hex').substring(0, 16).toUpperCase()}`;

        return {
            executionId: executionId,
            jobIdentity: jobIdentityResult.jobIdentity,
            attempt: attempt,
            status: 'INITIALIZED',
            createdAt: new Date().toISOString()
        };
    }

    /**
     * Evalúa el resultado de una ejecución y determina la política de recuperación y cuarentena.
     * @param {Object} job - EditorialJob original.
     * @param {Object} executionState - Estado obtenido al finalizar la ejecución o validación.
     * @returns {Object} Decisión de política de recuperación.
     */
    static evaluatePolicy(job, executionState) {
        if (!job || !executionState) {
            throw new Error('RECOVERY_POLICY_VIOLATION: Job o estado de ejecución ausente para evaluación.');
        }

        const status = executionState.status;
        const errors = executionState.errors || [];

        // 1. Clasificación: Validación Previa
        if (status === 'VALIDATION_FAILED' || errors.some(e => e.includes('EDITORIAL_JOB_VIOLATION'))) {
            return {
                action: 'REJECT_BEFORE_SANDBOX',
                failureClass: 'VALIDATION_FAILURE',
                transactionCommitted: false,
                quarantineRequired: true,
                reason: 'El job presenta infracciones estructurales o de integridad previas al despacho físico.'
            };
        }

        // 2. Clasificación: Fallo de Ejecución Física (Violación de No Partial Commit)
        if (status === 'EXECUTION_FAILED' || errors.some(e => e.includes('PHYSICAL_EXECUTION_VIOLATION') || e.includes('NO_PARTIAL_COMMIT'))) {
            return {
                action: 'ABORT_AND_ROLLBACK',
                failureClass: 'EXECUTION_FAILURE',
                transactionCommitted: false,
                quarantineRequired: true,
                reason: 'Fallo durante la ejecución física de primitivas UXP. Aplicado rollback preventivo de cero compromisos parciales.'
            };
        }

        // 3. Clasificación: Fallo de Round-Trip (Desvío Semántico)
        if (status === 'ROUNDTRIP_DRIFT_DETECTED' || errors.some(e => e.includes('ROUND_TRIP_VIOLATION'))) {
            return {
                action: 'QUARANTINE_RECORD',
                failureClass: 'ROUNDTRIP_FAILURE',
                transactionCommitted: false,
                quarantineRequired: true,
                reason: 'El árbol extraído (AST\') no cumple con la equivalencia semántica canónica respecto al baseline.'
            };
        }

        // 4. Éxito Absoluto
        if (status === 'ROUNDTRIP_VALIDATED' && errors.length === 0) {
            const expectedNodes = job.expected && job.expected.nodeCount ? job.expected.nodeCount : 87;
            const actualEntries = executionState.logicalLedger && executionState.logicalLedger.entries ? executionState.logicalLedger.entries.length : 0;

            if (actualEntries !== expectedNodes) {
                return {
                    action: 'ABORT_AND_ROLLBACK',
                    failureClass: 'INTEGRITY_FAILURE',
                    transactionCommitted: false,
                    quarantineRequired: true,
                    reason: `Discrepancia de masa en el ledger. Esperados: ${expectedNodes}, Registrados: ${actualEntries}.`
                };
            }

            return {
                action: 'AUTHORIZE_COMMIT',
                failureClass: NONE_OR_SUCCESS,
                transactionCommitted: true,
                quarantineRequired: false,
                reason: 'Todas las validaciones, ejecuciones físicas y auditorías de round-trip superadas con éxito.'
            };
        }

        // Caso predeterminado defensivo (Fallo genérico no clasificado)
        return {
            action: 'ABORT_AND_ROLLBACK',
            failureClass: 'EXECUTION_FAILURE',
            transactionCommitted: false,
            quarantineRequired: true,
            reason: 'Estado de ejecución desconocido o anómalo interceptado por política defensiva.'
        };
    }
}

// Símbolo auxiliar de éxito
const NONE_OR_SUCCESS = 'NONE';

module.exports = RecoveryPolicyEngine;