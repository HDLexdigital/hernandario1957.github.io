/**
 * E18.2.5.5.4 — RangeTextCollator
 * 
 * Condensador físico de evidencia textual para rangos topológicos (MERGE/SPLIT).
 * Concatena textos normalizados respetando estrictamente el orden de los índices
 * y genera una huella criptográfica SHA-256 reproducible de la evidencia colacionada.
 */

'use strict';

const crypto = require('crypto');

class RangeTextCollator {
    /**
     * Colaciona el texto de un rango de nodos canónicos de forma estrictamente física.
     * @param {Object} doc - ASTCanonicalDocument o DOMCanonicalDocument (solo lectura)
     * @param {Array<number>} range - Array de dos elementos [startIndex, endIndex]
     * @returns {Object} Resultado de colación inmutable
     */
    static collate(doc, range) {
        if (!doc || !Array.isArray(doc.nodes)) {
            throw new Error('[RangeTextCollator] Documento inválido o ausente de nodos.');
        }

        if (range === null || range === undefined) {
            throw new Error('[RangeTextCollator] Rango nulo o malformado.');
        }

        if (range.length === 0) {
            return {
                collatedText: '',
                nodeCount: 0,
                contentFingerprint: 'sha256:' + crypto.createHash('sha256').update('').digest('hex')
            };
        }

        if (!Array.isArray(range) || range.length !== 2 || typeof range[0] !== 'number' || typeof range[1] !== 'number') {
            throw new Error('[RangeTextCollator] Estructura de rango inválida.');
        }

        const [start, end] = range;

        if (start > end) {
            throw new Error(`[RangeTextCollator] Rango invertido: [${start}, ${end}]`);
        }

        if (doc.nodes.length === 0) {
            if (start === 0 && end === 0) {
                return { 
                    collatedText: '', 
                    nodeCount: 0, 
                    contentFingerprint: 'sha256:' + crypto.createHash('sha256').update('').digest('hex') 
                };
            }
            throw new Error(`[RangeTextCollator] Documento sin nodos para el rango [${start}, ${end}]`);
        }

        // Obtener los límites lógicos reales basados en las propiedades .index de los nodos
        const nodeIndices = doc.nodes.map((n, idx) => (n.index !== undefined ? n.index : idx));
        const minDocIdx = Math.min(...nodeIndices);
        const maxDocIdx = Math.max(...nodeIndices);

        if (start < minDocIdx || end > maxDocIdx) {
            throw new Error(`[RangeTextCollator] Rango fuera de límites: [${start}, ${end}] para límites del doc [${minDocIdx}, ${maxDocIdx}].`);
        }

        let collatedText = '';
        const selectedNodes = [];

        for (let i = 0; i < doc.nodes.length; i++) {
            const node = doc.nodes[i];
            const nodeIdx = node.index !== undefined ? node.index : i;
            if (nodeIdx >= start && nodeIdx <= end) {
                selectedNodes.push(node);
                collatedText += (node.normalizedText || '');
            }
        }

        const hash = crypto.createHash('sha256').update(collatedText).digest('hex');

        return {
            collatedText,
            nodeCount: selectedNodes.length,
            contentFingerprint: `sha256:${hash}`
        };
    }
}

module.exports = RangeTextCollator;