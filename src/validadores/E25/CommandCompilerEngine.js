/**
 * E25.1 — CommandCompilerEngine
 * 
 * - Actúa como puente entre E23 (Projection Plan Lógico) y E25 (Físico).
 * - Transforma operaciones lógicas en primitivas físicas (PhysicalCommand).
 * - Inyecta el blindaje de seguridad (jobIdentity, executionId, sessionId).
 * - Preserva invariantes forenses (nodeId).
 * - Rechaza planes no certificados o primitivas desconocidas.
 */

'use strict';

class CommandCompilerEngine {
    
    // Mapeo autorizado estricto (Evita que la física invente comandos)
    static AUTHORIZED_PRIMITIVES = new Set([
        'CREATE_DOCUMENT',
        'APPLY_PARAGRAPH_STYLE',
        'INJECT_TEXT'
    ]);

    /**
     * Compila un ProjectionPlan en una secuencia determinista de PhysicalCommands.
     * @param {Object} plan - ProjectionPlan certificado (E23).
     * @param {Object} sessionContext - Contexto de sesión activa (E24).
     * @returns {Array<Object>} Lista de comandos físicos listos para IPC.
     */
    static compilePlan(plan, sessionContext) {
        if (!plan || plan.status !== 'CERTIFIED') {
            throw new Error('PROJECTION_VIOLATION: El plan de proyección no está certificado.');
        }

        if (!sessionContext || !sessionContext.sessionId) {
            throw new Error('PROJECTION_VIOLATION: Falta contexto de sesión E24.');
        }

        const physicalCommands = [];

        for (const operation of plan.operations) {
            
            if (!this.AUTHORIZED_PRIMITIVES.has(operation.type)) {
                throw new Error(`COMPILER_ERROR: Operación lógica desconocida [${operation.type}]`);
            }

            const physicalCommand = {
                targetAction: 'executePhysicalPrimitive',
                
                // 1. Blindaje E24 (Invariantes 2, 3)
                jobIdentity: sessionContext.jobIdentity,
                executionId: sessionContext.executionId,
                sessionId: sessionContext.sessionId,

                // 2. Trazabilidad Forense (Invariante 4)
                nodeId: operation.nodeId || null,

                // 3. Carga Física (Invariante 6: Transcripción pura, sin magia)
                payload: {
                    primitiveType: operation.type,
                    ...operation.params
                }
            };

            physicalCommands.push(physicalCommand);
        }

        // Invariante 5: Orden preservado
        return physicalCommands;
    }
}

module.exports = CommandCompilerEngine;