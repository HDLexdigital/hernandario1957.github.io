/**
 * E19.4.1 — SplitAwareEvidence (Adaptador de Evidencia para Splits)
 * 
 * Analiza la evidencia física cuando existe fragmentación estructural (ALIGN.SPLIT):
 * - Garantiza que fragmentCount > 1 no distorsione la evaluación textual ni genere falsos CONTENT_ADDITION.
 * - Distingue variaciones de whitespace y compactación de divergencias reales de contenido.
 * - Deriva en UNKNOWN ante ambigüedades y preserva estrictamente editorialEquivalence: 'NOT_DEMONSTRATED'.
 * - Garantiza la inmutabilidad absoluta de los datos de entrada.
 */

'use strict';

class SplitAwareEvidence {
    /**
     * Compacta espacios normalizando la cadena Unicode NFC.
     * @private
     */
    static _compact(str) {
        return String(str || '').normalize('NFC').replace(/\s+/g, '');
    }

    /**
     * Genera una versión alfanumérica limpia para evaluar contención estructural.
     * @private
     */
    static _clean(str) {
        return String(str || '').replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
    }

    /**
     * Analiza un split evaluando la fragmentación geométrica frente al contenido textual.
     * @param {string} alignmentType - Tipo de alineación (ej. ALIGN.SPLIT)
     * @param {Array} astRange - Rango AST
     * @param {Array} domRange - Rango DOM
     * @param {string} astText - Texto original del nodo AST único
     * @param {Array<string>} domFragments - Fragmentos de texto de los nodos DOM involucrados
     * @returns {Object} Expediente de evidencia consciente de fragmentación inmutable
     */
    static analyzeSplit(alignmentType, astRange, domRange, astText, domFragments) {
        const astStr = String(astText || '');
        const fragments = Array.isArray(domFragments) ? domFragments : [String(domFragments || '')];
        const domStr = fragments.join('');

        const fragmentCount = fragments.length;
        const structuralFragmentation = alignmentType === 'ALIGN.SPLIT' || fragmentCount > 1;

        const compactedMatch = SplitAwareEvidence._compact(astStr) === SplitAwareEvidence._compact(domStr);
        
        const cleanAst = SplitAwareEvidence._clean(astStr);
        const cleanDom = SplitAwareEvidence._clean(domStr);

        let trueContentDivergence = false;
        let inferredType = 'WHITESPACE_VARIATION';

        if (compactedMatch) {
            trueContentDivergence = false;
            inferredType = 'WHITESPACE_VARIATION';
        } else if (cleanDom.includes(cleanAst) && cleanDom.length > cleanAst.length) {
            trueContentDivergence = true;
            inferredType = 'CONTENT_ADDITION';
        } else if (cleanAst.includes(cleanDom) && cleanAst.length > cleanDom.length) {
            trueContentDivergence = true;
            inferredType = 'CONTENT_DELETION';
        } else {
            trueContentDivergence = true;
            inferredType = 'UNKNOWN';
        }

        return Object.freeze({
            structuralFragmentation,
            fragmentCount,
            compactedMatch,
            trueContentDivergence,
            inferredType,
            editorialEquivalence: 'NOT_DEMONSTRATED'
        });
    }
}

module.exports = SplitAwareEvidence;