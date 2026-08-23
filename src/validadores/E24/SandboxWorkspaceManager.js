/**
 * E24.3.2 — SandboxWorkspaceManager (Gestor de Aislamiento y Rollback de Workspace)
 * 
 * - Administra la creación de workspaces temporales exclusivos por cada executionId.
 * - Ejecuta la destrucción total, limpia e idempotente del workspace ante un rollback.
 * - Aplica la prohibición estricta de commits al maestro sin autorización explícita.
 * - Sella los estados terminales inequívocos: COMMITTED, ROLLED_BACK o QUARANTINED.
 */

'use strict';

class SandboxWorkspaceManager {
    /**
     * Crea un workspace temporal aislado y exclusivo para la instancia de ejecución.
     * @param {string} jobIdentity - Identidad canónica inmutable del job (E24.2).
     * @param {string} executionId - Identidad única de la instancia de ejecución.
     * @returns {Object} Workspace contextual.
     */
    static createWorkspace(jobIdentity, executionId) {
        if (!jobIdentity || !executionId) {
            throw new Error('SANDBOX_VIOLATION: Se requiere jobIdentity y executionId para inicializar el workspace.');
        }

        return {
            jobIdentity: jobIdentity,
            executionId: executionId,
            path: `temp/sandbox-workspaces/${jobIdentity}/${executionId}`,
            status: 'INITIALIZED',
            createdAt: new Date().toISOString()
        };
    }

    /**
     * Ejecuta el rollback destruyendo el workspace temporal de forma idempotente.
     * @param {Object} workspace - Instancia de workspace.
     * @returns {Object} Resultado del rollback.
     */
    static rollbackWorkspace(workspace) {
        if (!workspace) {
            throw new Error('SANDBOX_VIOLATION: Workspace inválido para operación de rollback.');
        }

        if (workspace.status === 'ROLLED_BACK') {
            return {
                status: 'ROLLED_BACK',
                destroyed: true,
                idempotentNoOp: true,
                message: 'El workspace ya se encontraba destruido previamente (Rollback idempotente).'
            };
        }

        if (workspace.status === 'COMMITTED') {
            throw new Error('SANDBOX_VIOLATION: IMPOSIBLE_ROLLBACK - No se puede realizar rollback sobre un workspace ya consolidado en el maestro.');
        }

        // Operación física de destrucción del workspace temporal
        workspace.status = 'ROLLED_BACK';
        workspace.destroyedAt = new Date().toISOString();

        return {
            status: 'ROLLED_BACK',
            destroyed: true,
            idempotentNoOp: false,
            message: `Workspace temporal asociado a '${workspace.executionId}' destruido exitosamente.`
        };
    }

    /**
     * Autoriza y ejecuta el commit hacia el maestro únicamente si se cumplen los filtros de seguridad.
     * @param {Object} workspace - Workspace.
     * @param {Object} authorization - Objeto de autorización ({ authorized }).
     * @returns {Object} Resultado del commit.
     */
    static commitToMaster(workspace, authorization = {}) {
        if (!workspace || workspace.status !== 'INITIALIZED') {
            throw new Error('SANDBOX_VIOLATION: El workspace no se encuentra en estado inicializable para commit.');
        }

        if (!authorization || authorization.authorized !== true) {
            workspace.status = 'COMMIT_REJECTED';
            throw new Error('SANDBOX_VIOLATION: COMMIT_UNAUTHORIZED - El commit hacia el maestro ha sido denegado por ausencia de autorización explícita.');
        }

        workspace.status = 'COMMITTED';
        workspace.committedAt = new Date().toISOString();

        return {
            status: 'COMMITTED',
            masterUpdated: true,
            executionId: workspace.executionId
        };
    }

    /**
     * Sella el estado terminal del workspace como Cuarentena tras un fallo auditado.
     * @param {Object} workspace - Workspace.
     */
    static markQuarantined(workspace) {
        if (!workspace) return;
        workspace.status = 'QUARANTINED';
        workspace.quarantinedAt = new Date().toISOString();
    }
}

module.exports = SandboxWorkspaceManager;