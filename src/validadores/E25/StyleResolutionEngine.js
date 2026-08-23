/**
 * E25.5.1 — StyleResolutionEngine
 * 
 * - Resuelve con rigor estricto ParagraphStyles y CharacterStyles desde los recursos físicos de InDesign.
 * - Aplica política de cero fallbacks (STYLE_NOT_FOUND si el recurso no existe).
 * - Garantiza trazabilidad tridimensional y atomicidad ante fallos.
 */

'use strict';

class StyleResolutionEngine {

    /**
     * Resuelve y aplica el estilo físico al nodo objetivo bajo una transacción atómica.
     */
    static resolveAndApply(command, hostContext) {
        const response = {
            commandId: command.commandId,
            executionId: command.executionId,
            sessionId: command.sessionId,
            nodeId: command.nodeId,
            styleId: command.payload?.styleId,
            status: 'SUCCESS'
        };

        const { styleId, styleKind, simulateCrash } = command.payload;

        // 1. Resolución de Recursos con Cero Fallbacks (S1, S2)
        let resolvedStyle = null;
        if (styleKind === 'PARAGRAPH') {
            resolvedStyle = hostContext.resources.paragraphStyles[styleId];
        } else if (styleKind === 'CHARACTER') {
            resolvedStyle = hostContext.resources.characterStyles[styleId];
        }

        if (!resolvedStyle) {
            response.status = 'ERROR';
            response.reason = 'STYLE_NOT_FOUND';
            return response;
        }

        // Snapshot para Rollback Atómico (S6)
        const previousDomState = JSON.stringify(hostContext.dom);

        try {
            if (simulateCrash) {
                throw new Error('SIMULATED_FAILURE');
            }

            // 2. Aplicación directa al DOM físico (S7: Sin UI)
            hostContext.dom.targetNodeStyle = resolvedStyle;
            response.resolvedStyle = resolvedStyle;

        } catch (error) {
            // Rollback absoluto
            hostContext.dom = JSON.parse(previousDomState);
            response.status = 'ERROR';
            response.reason = 'STYLE_APPLICATION_ROLLED_BACK';
        }

        return response;
    }
}

module.exports = StyleResolutionEngine;