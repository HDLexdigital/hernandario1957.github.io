/**
 * E24.3.4 — FailureRecoveryOrchestrator (Orquestador de Recuperación y Cuarentena)
 * 
 * - Integra RecoveryPolicyEngine, SandboxWorkspaceManager y QuarantineRecordEngine.
 * - Ejecuta el ciclo imperativo: Evaluación de política -> Rollback de Sandbox -> Generación de Registro de Cuarentena.
 * - Aplica rígidamente NO_PARTIAL_COMMIT (cero commits ante fallos, bloqueo de cuarentenas falsas si el rollback falla).
 * - Garantiza determinismo absoluto e inmutabilidad en el paquete forense.
 */

'use strict';

const RecoveryPolicyEngine = require('./RecoveryPolicyEngine');
const SandboxWorkspaceManager = require('./SandboxWorkspaceManager');
const QuarantineRecordEngine = require('./QuarantineRecordEngine');
const CanonicalJobIdentityEngine = require('./CanonicalJobIdentityEngine');

class FailureRecoveryOrchestrator {
    /**
     * Orquesta el flujo completo de recuperación ante un fallo de ejecución o validación.
     * @param {Object} job - EditorialJob original inmutable.
     * @param {Object} failureContext - Contexto con errores, artefactos e indicios de ejecución.
     * @returns {Object} Informe de resolución y paquete forense de cuarentena.
     */
    static recover(job, failureContext) {
        if (!job || !failureContext) {
            throw new Error('RECOVERY_ORCHESTRATION_VIOLATION: Job o contexto de fallo ausente.');
        }

        const executionId = failureContext.executionId || 'EXEC_DEFAULT';
        const attempt = failureContext.attempt || 1;

        // 1. Obtener Identidad Canónica del Job (E24.2)
        const jobIdentityResult = CanonicalJobIdentityEngine.computeIdentity(job);
        const jobIdentity = jobIdentityResult.jobIdentity;

        // 2. Inicializar el Workspace Temporal (E24.3.2)
        let workspace;
        try {
            workspace = SandboxWorkspaceManager.createWorkspace(jobIdentity, executionId);
        } catch (e) {
            return {
                terminalState: 'FAILED',
                jobIdentity: jobIdentity,
                executionId: executionId,
                transactionCommitted: false,
                masterWorkspaceTouched: false,
                quarantineRecord: null,
                errors: [`WORKSPACE_CREATION_FAILURE: ${e.message}`]
            };
        }

        // 3. Evaluar la Política de Recuperación (E24.3.1)
        const policyDecision = RecoveryPolicyEngine.evaluatePolicy(job, {
            status: failureContext.status || 'EXECUTION_FAILED',
            logicalLedger: failureContext.logicalLedger || { entries: [] },
            errors: failureContext.errors || ['Fallo operacional no especificado.']
        });

        // 4. Ejecutar Rollback del Workspace (E24.3.2)
        let rollbackResult;
        try {
            if (failureContext.forceRollbackFailure === true) {
                throw new Error('Fallo simulado y forzado del sistema de archivos del workspace.');
            }
            rollbackResult = SandboxWorkspaceManager.rollbackWorkspace(workspace);
        } catch (e) {
            // Regla de oro: Si el rollback falla, estado terminal FAILED sin cuarentena falsa (Protección No Partial Commit)
            SandboxWorkspaceManager.markQuarantined(workspace);
            return {
                terminalState: 'FAILED',
                jobIdentity: jobIdentity,
                executionId: executionId,
                transactionCommitted: false,
                masterWorkspaceTouched: false,
                quarantineRecord: null,
                errors: [`ROLLBACK_FAILURE: No se pudo destruir el workspace temporal de forma segura. Motivo: ${e.message}`]
            };
        }

        // 5. Si el fallo amerita Cuarentena, empaquetar la evidencia forense (E24.3.3)
        let quarantineRecord = null;
        if (policyDecision.quarantineRequired) {
            const incidentPayload = {
                jobIdentity: jobIdentity,
                executionId: executionId,
                attempt: attempt,
                failure: {
                    failureClass: policyDecision.failureClass || 'EXECUTION_FAILURE',
                    code: policyDecision.failureClass,
                    message: (failureContext.errors && failureContext.errors[0]) || policyDecision.reason,
                    stage: failureContext.stage || 'E24.3'
                },
                recovery: {
                    decision: policyDecision.action,
                    policy: job.policy.transactionPolicy
                },
                workspace: {
                    disposition: rollbackResult.status
                },
                artifacts: failureContext.artifacts || [],
                evidence: failureContext.evidence || {}
            };

            quarantineRecord = QuarantineRecordEngine.createQuarantineRecord(incidentPayload);
            SandboxWorkspaceManager.markQuarantined(workspace);
        }

        // 6. Retornar el Estado Terminal Consolidado
        return {
            terminalState: policyDecision.quarantineRequired ? 'QUARANTINED' : 'ROLLED_BACK',
            jobIdentity: jobIdentity,
            executionId: executionId,
            transactionCommitted: false,
            masterWorkspaceTouched: false,
            workspaceDisposition: rollbackResult.status,
            quarantineRecord: quarantineRecord,
            errors: failureContext.errors || []
        };
    }
}

module.exports = FailureRecoveryOrchestrator;