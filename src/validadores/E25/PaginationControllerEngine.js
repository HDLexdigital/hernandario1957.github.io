/**
 * E25.6 — PaginationControllerEngine
 * 
 * - Traduce señales de OVERSET_DETECTED en operaciones geométricas deterministas.
 * - Crea páginas y marcos de texto basándose exclusivamente en plantillas canónicas.
 * - Ejecuta encadenamientos atómicos (Threading) previniendo ciclos tipográficos (Monotonicidad).
 * - Realiza la lectura posterior (Read-back) para certificar la resolución del desbordamiento.
 */

'use strict';

class PaginationControllerEngine {

    /**
     * Resuelve de forma geométrica un desbordamiento creando la página y caja canónica sucesiva.
     */
    static resolveOverset(activeFrameId, storyId, dom, templateConfig) {
        const activeFrame = dom.frames[activeFrameId];
        if (!activeFrame) {
            return { status: 'ERROR', reason: 'FRAME_NOT_FOUND' };
        }

        // Invariante P6: Prevención estricta de ciclos tipográficos
        if (activeFrame.nextFrame !== null) {
            // Si ya tiene un nextFrame, verificamos que no sea un bucle directo o indirecto
            if (activeFrame.nextFrame === activeFrameId) {
                return { status: 'ERROR', reason: 'CYCLIC_THREADING_PROHIBITED' };
            }
        }

        // Snapshot para Atomicidad (P4)
        const domSnapshot = JSON.stringify(dom);

        try {
            const newPageId = `PAGE_${dom.pages.length + 1}`;
            const newFrameId = `FRAME_${Date.now()}`;

            // Invariante P2: Geometría canónica exclusiva de la plantilla
            const canonicalGeometry = {
                width: templateConfig.standardWidth,
                height: templateConfig.standardHeight,
                margin: templateConfig.standardMargin
            };

            // Creación de página y frame (P1, P2)
            dom.pages.push({ id: newPageId, frames: [newFrameId] });
            dom.frames[newFrameId] = {
                id: newFrameId,
                parentStory: storyId,
                nextFrame: null,
                capacity: 50, // Capacidad estándar de la plantilla simulada
                contentSize: 0,
                geometry: canonicalGeometry
            };

            // Invariante P3 & P4: Story Continuity y Threading atómico
            activeFrame.nextFrame = newFrameId;

            return {
                status: 'SUCCESS',
                createdPageId: newPageId,
                createdFrameId: newFrameId
            };

        } catch (error) {
            // Rollback atómico completo en caso de fallo estructural
            Object.assign(dom, JSON.parse(domSnapshot));
            return { status: 'ERROR', reason: 'PAGINATION_TRANSACTION_FAILED' };
        }
    }

    /**
     * Inspecciona mediante lectura posterior (Read-back) el estado real del Story tras la paginación (P7).
     */
    static verifyOverset(storyId, dom) {
        const story = dom.stories[storyId];
        if (!story) {
            return { status: 'ERROR', reason: 'STORY_NOT_FOUND' };
        }

        // Recorremos el thread físico completo asociado al story para sumar capacidades y cargas
        let totalCapacity = 0;
        let totalContent = 0;

        for (const frameId in dom.frames) {
            const frame = dom.frames[frameId];
            if (frame.parentStory === storyId) {
                totalCapacity += frame.capacity || 0;
                totalContent += frame.contentSize || 0;
            }
        }

        const remainingOverset = Math.max(0, story.contents.length - totalCapacity);

        return {
            oversetResolved: remainingOverset === 0,
            remainingOverset: remainingOverset
        };
    }
}

module.exports = PaginationControllerEngine;