/**
 * E25.5.3 — ExportTagProjectionEngine
 * 
 * - Valida y proyecta el mapping determinista de exportación semántica (EPUB3 / WCAG).
 * - Aplica política estricta de rechazo ante ausencia o invalidez de tags.
 * - Garantiza atomicidad con rollback y provee el método de lectura posterior (Read-back).
 */

'use strict';

class ExportTagProjectionEngine {

    /**
     * Proyecta la etiqueta de exportación sobre el recurso físico de InDesign.
     */
    static projectExportTag(command, hostContext) {
        const response = {
            commandId: command.commandId,
            executionId: command.executionId,
            sessionId: command.sessionId,
            styleId: command.payload?.styleId,
            status: 'SUCCESS'
        };

        const { styleId, styleKind, overrideTag, simulateCrash } = command.payload;

        // 1. Validación de existencia del recurso tipográfico base
        const styleResource = styleKind === 'PARAGRAPH' 
            ? hostContext.resources.paragraphStyles[styleId]
            : hostContext.resources.characterStyles?.[styleId];

        if (!styleResource) {
            response.status = 'ERROR';
            response.reason = 'STYLE_NOT_FOUND';
            return response;
        }

        // 2. Determinación del Tag (Usa el certificado o un override explícito evaluado)
        const targetTag = overrideTag !== undefined ? overrideTag : styleResource.exportTag;

        // Invariante: Strict Missing Tag
        if (!targetTag) {
            response.status = 'ERROR';
            response.reason = 'EXPORT_TAG_NOT_FOUND';
            return response;
        }

        // Invariante: Strict Invalid Tag (Vacíos o espacios en blanco)
        if (typeof targetTag !== 'string' || targetTag.trim() === '') {
            response.status = 'ERROR';
            response.reason = 'INVALID_EXPORT_TAG';
            return response;
        }

        // Snapshot para Rollback Atómico
        const previousDomState = JSON.stringify(hostContext.dom);

        try {
            if (simulateCrash) {
                throw new Error('SIMULATED_CRASH');
            }

            // Inyección física en el DOM simulado de InDesign
            hostContext.dom.appliedStyles[styleId] = {
                exportTag: targetTag.trim()
            };

            response.assignedExportTag = targetTag.trim();

        } catch (error) {
            // Rollback absoluto
            hostContext.dom = JSON.parse(previousDomState);
            response.status = 'ERROR';
            response.reason = 'EXPORT_TAG_APPLICATION_ROLLED_BACK';
        }

        return response;
    }

    /**
     * Inspecciona físicamente el DOM de InDesign para realizar la verificación posterior (Read-back).
     */
    static readBackExportTag(styleId, hostContext) {
        const nodeMetadata = hostContext.dom.appliedStyles[styleId];
        return nodeMetadata ? nodeMetadata.exportTag : null;
    }
}

module.exports = ExportTagProjectionEngine;