/**
 * E23.3.3 — UxpProjectorExecutor (Ejecutor del Proyector UXP / Modo DRY_RUN)
 * 
 * - Audita planes de proyección intermedios de forma estricta y de solo lectura.
 * - Valida la ausencia absoluta de IDs 'unknown-id' o vacíos.
 * - Exige la obligatoriedad de los metadatos de proyección (paragraphStyle, exportTag).
 * - Garantiza cero mutaciones en modo DRY_RUN y emite un informe de auditoría verificado.
 */

'use strict';

class UxpProjectorExecutor {
    /**
     * Ejecuta la auditoría en modo DRY_RUN o proyección física de un plan.
     * @param {Object} projectionPlan - Plan de proyección estructurado.
     * @param {Object} options - Opciones de ejecución ({ dryRun: boolean }).
     * @returns {Object} Informe de auditoría de ejecución.
     */
    static execute(projectionPlan, options = { dryRun: true }) {
        if (!projectionPlan || !projectionPlan.nodes || !Array.isArray(projectionPlan.nodes)) {
            throw new Error('UXP_PROJECTOR_VIOLATION: Plan de proyección inválido o ausente.');
        }

        let auditedNodesCount = 0;

        const auditNode = (node) => {
            if (!node || typeof node !== 'object') {
                throw new Error('UXP_PROJECTOR_VIOLATION: Nodo de proyección malformado.');
            }

            // Invariante 1: Prohibición estricta de 'unknown-id' o IDs vacíos
            if (!node.id || node.id === 'unknown-id' || String(node.id).trim() === '') {
                throw new Error(`UXP_PROJECTOR_VIOLATION: Se detectó un nodo con identificador prohibido o 'unknown-id' (ID: ${node.id}).`);
            }

            // Invariante 2: Metadatos obligatorios de proyección
            if (!node.projection || typeof node.projection !== 'object') {
                throw new Error(`UXP_PROJECTOR_VIOLATION: El nodo con ID '${node.id}' carece del objeto de proyección.`);
            }

            const { paragraphStyle, exportTag } = node.projection;

            if (!paragraphStyle || typeof paragraphStyle !== 'string' || paragraphStyle.trim() === '') {
                throw new Error(`UXP_PROJECTOR_VIOLATION: El nodo con ID '${node.id}' carece de un paragraphStyle válido.`);
            }

            if (!exportTag || typeof exportTag !== 'string' || exportTag.trim() === '') {
                throw new Error(`UXP_PROJECTOR_VIOLATION: El nodo con ID '${node.id}' carece de un exportTag válido.`);
            }

            auditedNodesCount++;

            if (node.children && Array.isArray(node.children)) {
                node.children.forEach(child => auditNode(child));
            }
        };

        projectionPlan.nodes.forEach(node => auditNode(node));

        return {
            status: 'AUDIT_SUCCESS',
            mode: options.dryRun ? 'DRY_RUN' : 'LIVE',
            auditedNodesCount: auditedNodesCount,
            mutationsPerformed: 0
        };
    }
}

module.exports = UxpProjectorExecutor;