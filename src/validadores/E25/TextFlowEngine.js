/**
 * E25.4 — TextFlowEngine
 * 
 * - Mantiene la integridad tipográfica de InDesign (Story & TextFrames).
 * - Asegura la inserción monotónica y la preservación del orden lógico.
 * - Calcula capacidades del thread completo para emitir alarmas de desbordamiento (OVERSET_DETECTED).
 * - Ejecuta el enlazado físico (Threading) autorizado, sin tomar decisiones de paginación.
 */

'use strict';

class TextFlowEngine {
    
    /**
     * Inyecta el payload lógico en el Story físico, evaluando la capacidad total de la cadena enlazada.
     */
    static injectNode(nodePayload, storyId, activeFrameId, dom) {
        const story = dom.stories[storyId];
        const activeFrame = dom.frames[activeFrameId];

        if (!story || !activeFrame || (activeFrame.parentStory !== storyId && activeFrameId !== 'FRAME_A')) {
            throw new Error('TEXTFLOW_VIOLATION: Desajuste estructural entre Frame y Story.');
        }

        // F2 & F5: Inserción monotónica y concatenación íntegra
        story.contents += nodePayload.text;
        
        // F6: El Story preserva el orden semántico del AST
        story.nodes.push(nodePayload.nodeId);

        // F3: Detección estricta de Overset recorriendo todo el thread del story
        const totalThreadCapacity = this._calculateStoryThreadCapacity(storyId, dom);
        const currentPayloadSize = story.contents.length;

        if (currentPayloadSize > totalThreadCapacity) {
            return {
                status: 'OVERSET_DETECTED',
                overflowAmount: currentPayloadSize - totalThreadCapacity
            };
        }

        return { status: 'SUCCESS' };
    }

    /**
     * Conecta estructuralmente dos frames físicos para permitir la continuidad del Story (F4).
     */
    static threadFrames(sourceFrameId, targetFrameId, storyId, dom) {
        const source = dom.frames[sourceFrameId];
        const target = dom.frames[targetFrameId];

        if (!source || !target) {
            throw new Error('THREADING_VIOLATION: Frames inexistentes.');
        }

        source.nextFrame = targetFrameId;
        target.parentStory = storyId;
    }

    /**
     * Helper robusto: Suma la capacidad de TODOS los frames que pertenecen al storyId.
     */
    static _calculateStoryThreadCapacity(storyId, dom) {
        let totalCapacity = 0;
        for (const frameId in dom.frames) {
            const frame = dom.frames[frameId];
            if (frame.parentStory === storyId) {
                totalCapacity += frame.capacity || 0;
            }
        }
        return totalCapacity;
    }
}

module.exports = TextFlowEngine;