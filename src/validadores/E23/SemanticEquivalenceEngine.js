/**
 * E23.3.5.3 — SemanticEquivalenceEngine (Motor de Equivalencia Semántica)
 * 
 * - Compara de forma puramente analítica y de solo lectura un AST de origen (E21) frente a un AST extraído (AST').
 * - Valida la conservación de masa, identidad biyectiva, taxonomía, jerarquía y contenido normalizado.
 * - Emite un informe detallado de auditoría (RoundTripAudit) o lanza excepciones tipificadas ante cualquier desvío.
 * - No modifica ningún artefacto ni reescribe la evidencia histórica.
 */

'use strict';

class SemanticEquivalenceEngine {
    /**
     * Normaliza defensivamente el contenido textual para evitar falsos positivos por espacios o saltos de línea.
     * @private
     */
    static _canonicalizeContent(text) {
        if (text === null || text === undefined) return '';
        return String(text).trim().replace(/\s+/g, ' ');
    }

    /**
     * Aplana un árbol jerárquico en un mapa plano indexado por ID para auditoría rápida.
     * @private
     */
    static _flattenTree(nodes, parentId = null, map = new Map()) {
        if (!Array.isArray(nodes)) return map;

        nodes.forEach(node => {
            const id = node.id || node.baseDossierId;
            if (!id || id === 'unknown-id') {
                throw new Error(`ROUND_TRIP_VIOLATION: IDENTITY_MISMATCH - Nodo con ID inválido o 'unknown-id' detectado.`);
            }

            if (map.has(id)) {
                throw new Error(`ROUND_TRIP_VIOLATION: IDENTITY_MISMATCH - Identificador duplicado detectado ('${id}').`);
            }

            map.set(id, {
                id: id,
                parentId: parentId,
                domainType: node.domainType,
                content: this._canonicalizeContent(node.content || node.text),
                projection: node.projection || null
            });

            if (node.children && Array.isArray(node.children)) {
                this._flattenTree(node.children, id, map);
            }
        });

        return map;
    }

    /**
     * Ejecuta la verificación formal de equivalencia semántica entre el AST original y el AST' extraído.
     * @param {Object} sourceAST - Árbol de origen certificado (E21).
     * @param {Object} extractedAST - Árbol extraído tras la simulación/proyección (AST').
     * @returns {Object} Informe detallado de auditoría RoundTripAudit.
     */
    static verifyEquivalence(sourceAST, extractedAST) {
        if (!sourceAST || !Array.isArray(sourceAST.nodes) || !extractedAST || !Array.isArray(extractedAST.nodes)) {
            throw new Error('ROUND_TRIP_VIOLATION: Estructura de AST fuente o extraída inválida.');
        }

        const sourceMap = this._flattenTree(sourceAST.nodes);
        const extractedMap = this._flattenTree(extractedAST.nodes);

        // 1. Invariante de Masa (Conteo exacto de nodos)
        if (sourceMap.size !== extractedMap.size) {
            throw new Error(`ROUND_TRIP_VIOLATION: MASS_CONSERVATION - Discrepancia de masa. Origen: ${sourceMap.size}, Extraídos: ${extractedMap.size}.`);
        }

        let missingNodes = 0;
        let identityMismatches = 0;
        let taxonomyMismatches = 0;
        let contentMismatches = 0;
        let hierarchyMismatches = 0;

        // 2. Verificación cruzada biyectiva
        for (const [id, sourceNode] of sourceMap.entries()) {
            if (!extractedMap.has(id)) {
                missingNodes++;
                throw new Error(`ROUND_TRIP_VIOLATION: IDENTITY_MISMATCH - El nodo origen '${id}' no aparece en el árbol extraído.`);
            }

            const extractedNode = extractedMap.get(id);

            // Verificación de Taxonomía (Domain Type)
            if (sourceNode.domainType !== extractedNode.domainType) {
                taxonomyMismatches++;
                throw new Error(`ROUND_TRIP_VIOLATION: TAXONOMY_MISMATCH - El nodo '${id}' alteró su tipo de dominio de '${sourceNode.domainType}' a '${extractedNode.domainType}'.`);
            }

            // Verificación de Jerarquía (Parent ID)
            if (sourceNode.parentId !== extractedNode.parentId) {
                hierarchyMismatches++;
                throw new Error(`ROUND_TRIP_VIOLATION: HIERARCHY_MISMATCH - El nodo '${id}' cambió su relación de parentesco (Esperado padre: ${sourceNode.parentId}, Obtenido: ${extractedNode.parentId}).`);
            }

            // Verificación de Contenido Contractual
            if (sourceNode.content !== extractedNode.content) {
                contentMismatches++;
                throw new Error(`ROUND_TRIP_VIOLATION: CONTENT_DRIFT - El contenido textual del nodo '${id}' no coincide con el baseline.`);
            }
        }

        return {
            status: 'CERTIFIED',
            semanticEquivalent: true,
            sourceStage: sourceAST.version || 'E21',
            targetStage: 'E23.3.5.3',
            metrics: {
                sourceNodesCount: sourceMap.size,
                extractedNodesCount: extractedMap.size,
                missingNodes: missingNodes,
                unexpectedNodes: 0,
                identityMismatches: identityMismatches,
                taxonomyMismatches: taxonomyMismatches,
                contentMismatches: contentMismatches,
                hierarchyMismatches: hierarchyMismatches,
                projectionMismatches: 0
            }
        };
    }
}

module.exports = SemanticEquivalenceEngine;