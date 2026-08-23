/**
 * E19.3 — TextDiscrepancyClassifier (Clasificador Canónico de Discrepancias)
 * 
 * Tipifica la evidencia física provista por TextEvidenceEngine basándose 
 * estrictamente en la taxonomía inmutable, manteniendo editorialEquivalence 
 * en 'NOT_DEMONSTRATED' y derivando toda ambigüedad en 'UNKNOWN'.
 */

'use strict';

class TextDiscrepancyClassifier {
    /**
     * Clasifica una divergencia textual basándose puramente en la evidencia física objetiva.
     * @param {number} mismatchIndex - Índice de desajuste
     * @param {Array} astRange - Rango de nodos AST
     * @param {Array} domRange - Rango de nodos DOM
     * @param {string} astText - Texto original del AST
     * @param {string} domText - Texto procesado del DOM
     * @param {Object} evidence - Expediente de evidencia física de TextEvidenceEngine
     * @returns {Object} Expediente de clasificación tipificado
     */
    static classify(mismatchIndex, astRange, domRange, astText, domText, evidence) {
        let type = 'UNKNOWN';
        let confidence = 'LOW';

        const astStr = String(astText || '');
        const domStr = String(domText || '');

        // Representación limpia alfanumérica para evaluar contención estructural sin ruido de puntuación
        const cleanAst = astStr.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
        const cleanDom = domStr.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();

        if (evidence.exactMatch) {
            type = 'EXACT_MATCH';
            confidence = 'HIGH';
        } else if (evidence.unicodeNormalizedMatch && !evidence.exactMatch) {
            type = 'TYPOGRAPHIC_NORMALIZATION';
            confidence = 'HIGH';
        } else if (evidence.compactedMatch && !evidence.exactMatch) {
            type = 'WHITESPACE_VARIATION';
            confidence = 'HIGH';
        } else if (evidence.substitutionCount > 0 && evidence.lengthDifference === 0) {
            type = 'CHARACTER_SUBSTITUTION';
            confidence = 'MEDIUM';
        } else if (evidence.lengthDifference > 0 && cleanDom.includes(cleanAst)) {
            type = 'CONTENT_ADDITION';
            confidence = 'MEDIUM';
        } else if (evidence.lengthDifference < 0 && cleanAst.includes(cleanDom)) {
            type = 'CONTENT_DELETION';
            confidence = 'MEDIUM';
        } else {
            type = 'UNKNOWN';
            confidence = 'LOW';
        }

        return {
            mismatchIndex,
            astRange: [...astRange],
            domRange: [...domRange],
            classification: {
                type,
                confidence
            },
            editorialEquivalence: 'NOT_DEMONSTRATED'
        };
    }
}

module.exports = TextDiscrepancyClassifier;