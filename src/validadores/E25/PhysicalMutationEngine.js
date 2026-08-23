/**
 * E25.3 — PhysicalMutationEngine
 * 
 * - Gemelo Digital (Simulador) del contrato que deberá cumplir el script de Adobe InDesign.
 * - Garantiza la correlación, la atomicidad, y el aislamiento de Workspace y UI.
 * - Atrapa errores del DOM (Safe Trapping).
 */

'use strict';

class PhysicalMutationEngine {
    
    /**
     * Ejecuta una primitiva física contra el estado de InDesign simulado.
     * @param {Object} command - PhysicalCommand transportado por E25.2.
     * @param {Object} hostContext - El entorno de InDesign (sesión, DOM, resources).
     * @returns {Object} Respuesta correlacionada (SUCCESS/ERROR).
     */
    static execute(command, hostContext) {
        
        // Plantilla de Respuesta Correlacionada (Invariante M1)
        const response = {
            commandId: command.commandId,
            executionId: command.executionId,
            sessionId: command.sessionId,
            status: 'SUCCESS'
        };

        // Invariante M5: Workspace Binding
        if (command.targetWorkspace !== hostContext.activeWorkspaceId) {
            response.status = 'ERROR';
            response.reason = 'WORKSPACE_MISMATCH';
            return response;
        }

        // Clonamos el estado del DOM para garantizar Atomicidad (M6)
        const domSnapshot = JSON.stringify(hostContext.dom);

        try {
            this._applyMutation(command.payload, hostContext);
        } catch (error) {
            // Rollback Atómico (M6)
            hostContext.dom = JSON.parse(domSnapshot);
            
            response.status = 'ERROR';
            response.reason = error.message;
        }

        return response;
    }

    /**
     * Aplica la mutación lógica. Si falla, hace throw para que el wrapper atómico lo capture (M4).
     */
    static _applyMutation(payload, hostContext) {
        switch (payload.primitiveType) {
            
            case 'CREATE_TEXT_FRAME':
                hostContext.dom.textFrames.push({ content: payload.content });
                break;

            case 'APPLY_STYLE':
                // Invariante M2: Cero Fallbacks. Si no existe, falla explosivamente.
                if (!hostContext.resources.paragraphStyles.includes(payload.styleName)) {
                    throw new Error('STYLE_NOT_FOUND');
                }
                break;

            case 'MUTATE_SELECTION':
                // Invariante M3: Sin dependencias de UI
                if (hostContext.ui.selection !== undefined) {
                    throw new Error('UI_DEPENDENCY_PROHIBITED');
                }
                break;

            case 'TRIGGER_DOM_CRASH':
                // Invariante M4: DOM Errors no rompen el Host
                throw new Error('INDESIGN_DOM_ERROR');

            case 'ATOMIC_COMPOSITE_FAILING':
                // Paso 1: Mutación (crea un text frame)
                hostContext.dom.textFrames.push({ content: 'Orphaned Text' });
                // Paso 2: Falla inminente (ej. estilo no encontrado en el frame recién creado)
                throw new Error('PARTIAL_MUTATION_ROLLED_BACK');

            default:
                throw new Error('UNKNOWN_PRIMITIVE');
        }
    }
}

module.exports = PhysicalMutationEngine;