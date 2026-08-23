/**
 * E19.4.3 — CharacterLevelAudit (Motor de Auditoría Diferencial a Nivel de Caracteres)
 * 
 * Descompone cadenas AST y DOM en puntos de código Unicode (Code Points) para:
 * - Aislar deltas de espacios, caracteres de control y separadores de formato.
 * - Determinar si un incremento de longitud es un artefacto estructural o contenido genuino.
 * - Garantizar inmutabilidad absoluta y editorialEquivalence: 'NOT_DEMONSTRATED'.
 */

'use strict';

class CharacterLevelAudit {
    /**
     * Cuenta caracteres de control y espacios especiales (incluyendo Zero-Width spaces, etc.).
     * @private
     */
    static _countControlAndSpecialChars(str) {
        const matches = String(str || '').match(/[\p{Cc}\p{Cf}\p{Z}]/gu);
        return matches ? matches.length : 0;
    }

    /**
     * Extrae texto estrictamente alfanumérico para evaluar contenido genuino.
     * @private
     */
    static _getAlphanumericContent(str) {
        const matches = String(str || '').match(/[\p{L}\p{N}]/gu);
        return matches ? matches.join('') : '';
    }

    /**
     * Analiza las diferencias a nivel de code points entre AST y DOM.
     * @param {string} astText - Texto del nodo AST
     * @param {string} domText - Texto del DOM o fragmentos colacionados
     * @returns {Object} Informe de auditoría diferencial inmutable
     */
    static analyzeCodePoints(astText, domText) {
        const astStr = String(astText || '');
        const domStr = String(domText || '');

        const astCodePointsCount = Array.from(astStr).length;
        const domCodePointsCount = Array.from(domStr).length;

        const astWhitespaceCount = (astStr.match(/\s/g) || []).length;
        const domWhitespaceCount = (domStr.match(/\s/g) || []).length;
        const whitespaceDelta = domWhitespaceCount - astWhitespaceCount;

        const astControlCount = CharacterLevelAudit._countControlAndSpecialChars(astStr);
        const domControlCount = CharacterLevelAudit._countControlAndSpecialChars(domStr);
        const controlCharacterCount = domControlCount - astControlCount;

        const astAlpha = CharacterLevelAudit._getAlphanumericContent(astStr);
        const domAlpha = CharacterLevelAudit._getAlphanumericContent(domStr);

        const hasGenuineContentAddition = domAlpha.length > astAlpha.length && domAlpha.includes(astAlpha);

        let causalClassification = 'STRUCTURAL_WHITESPACE_ARTIFACT';
        if (hasGenuineContentAddition) {
            causalClassification = 'GENUINE_CONTENT_ADDITION';
        } else if (astStr === domStr) {
            causalClassification = 'EXACT_MATCH';
        } else if (whitespaceDelta !== 0 || controlCharacterCount !== 0 || domAlpha.length === astAlpha.length) {
            causalClassification = 'STRUCTURAL_WHITESPACE_ARTIFACT';
        } else {
            causalClassification = 'UNKNOWN';
        }

        return Object.freeze({
            astCodePointsCount,
            domCodePointsCount,
            whitespaceDelta,
            controlCharacterCount,
            hasGenuineContentAddition,
            causalClassification,
            editorialEquivalence: 'NOT_DEMONSTRATED'
        });
    }
}

module.exports = CharacterLevelAudit;