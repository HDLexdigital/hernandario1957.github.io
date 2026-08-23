/**
 * E23.3.1 / E23.3.2 — Projection Adapter (Adaptador de Proyección Editorial)
 * 
 * - Convierte un Árbol Derivado certificado (E21) en un Plan de Proyección intermedio.
 * - Aplica mapeos explícitos entre el tipo de dominio (DOMAIN TYPE) y el estilo editorial (INDESIGN STYLE).
 * - Resuelve robustamente IDs heterogéneos o genera identificadores jerárquicos únicos (cero 'unknown-id').
 * - Falla con PROJECTION_MAPPING_VIOLATION si encuentra entidades carentes de regla de mapeo.
 * - Garantiza determinismo absoluto y preserva la inmutabilidad del AST de entrada.
 */

'use strict';

class ProjectionAdapter {
    /**
     * Genera un plan de proyección intermedio a partir del AST certificado y las reglas de mapeo.
     * @param {Object} certifiedAST - Árbol derivado de E21.
     * @param {Object} mappingRules - Tabla de configuración de estilos y etiquetas.
     * @returns {Object} Plan de proyección estructurado.
     */
    static generatePlan(certifiedAST, mappingRules) {
        if (!certifiedAST || !certifiedAST.nodes || !Array.isArray(certifiedAST.nodes)) {
            throw new Error('PROJECTION_VIOLATION: El AST certificado proporcionado es inválido.');
        }
        if (!mappingRules || typeof mappingRules !== 'object') {
            throw new Error('PROJECTION_VIOLATION: Se requieren reglas de mapeo válidas para generar la proyección.');
        }

        let childCounter = 0;

        const projectNode = (node, parentId = 'ROOT') => {
            const domainType = node.semanticType;
            
            if (!domainType || !mappingRules[domainType]) {
                throw new Error(`PROJECTION_MAPPING_VIOLATION: No existe una regla de mapeo configurada para el tipo de dominio '${domainType}'.`);
            }

            const styleConfig = mappingRules[domainType];

            // 🛠️ Resolución estricta de identidad: cero 'unknown-id', garantizando IDs jerárquicos únicos
            childCounter++;
            const fallbackId = `${parentId}_CHILD_${childCounter}`;
            const resolvedId = node.baseDossierId || node.id || node.childId || node.nodeId || fallbackId;

            // 🛠️ Resolución robusta de contenido textual
            const resolvedContent = node.content !== undefined ? node.content : (node.text !== undefined ? node.text : null);

            let projectedChildren = [];
            if (node.children && Array.isArray(node.children)) {
                projectedChildren = node.children.map(child => projectNode(child, resolvedId));
            }

            return {
                id: resolvedId,
                domainType: domainType,
                content: resolvedContent,
                projection: {
                    target: 'INDESIGN',
                    paragraphStyle: styleConfig.paragraphStyle,
                    exportTag: styleConfig.exportTag || null
                },
                children: projectedChildren
            };
        };

        const projectedNodes = certifiedAST.nodes.map(node => projectNode(node, node.baseDossierId || node.id || 'ROOT'));

        return {
            projectionVersion: 'E23.3.2',
            source: {
                stage: 'E21'
            },
            nodes: projectedNodes
        };
    }
}

module.exports = ProjectionAdapter;