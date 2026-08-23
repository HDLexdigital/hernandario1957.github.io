/**
 * E19.2 — TextEvidenceEngine (Motor de Evidencia Física Textual)
 * 
 * Actúa como observador imparcial extrayendo métricas físicas objetivas entre textos AST y DOM:
 * - Mide longitudes, deltas de espacios, huellas dactilares y coincidencias compactadas.
 * - Garantiza la inmutabilidad de los textos y carece de lógica de clasificación o corrección.
 */

'use strict';

const crypto = require('crypto');

class TextEvidenceEngine {
    /**
     * Genera una huella dactilar criptográfica segura para una cadena de texto.
     * @private
     */
    static _hash(str) {
        return crypto.createHash('sha256').update(String(str || '')).digest('hex');
    }

    /**
     * Compacta espacios normalizando la cadena Unicode NFC.
     * @private
     */
    static _compact(str) {
        return String(str || '').normalize('NFC').replace(/\s+/g, '');
    }

    /**
     * Cuenta el número total de caracteres de espacio en blanco.
     * @private
     */
    static _countWhitespace(str) {
        const matches = String(str || '').match(/\s/g);
        return matches ? matches.length : 0;
    }

    /**
     * Calcula diferencias puntuales de caracteres entre ambas cadenas.
     * @private
     */
    static _countSubstitutions(ast, dom) {
        if (ast === dom) return 0;
        let diffs = 0;
        const maxLen = Math.max(ast.length, dom.length);
        for (let i = 0; i < maxLen; i++) {
            if (ast[i] !== dom[i]) diffs++;
        }
        return diffs;
    }

    /**
     * Analiza dos textos alineados y extrae evidencia física objetiva.
     * @param {string} astText - Texto original del AST
     * @param {string} domText - Texto procesado del DOM
     * @returns {Object} Expediente de evidencia física inmutable
     */
    static analyze(astText, domText) {
        const astStr = String(astText || '');
        const domStr = String(domText || '');

        const astLength = astStr.length;
        const domLength = domStr.length;
        const exactMatch = astStr === domStr;
        const lengthDifference = domLength - astLength;

        const astSpaces = TextEvidenceEngine._countWhitespace(astStr);
        const domSpaces = TextEvidenceEngine._countWhitespace(domStr);
        const whitespaceDelta = domSpaces - astSpaces;

        const compactedMatch = TextEvidenceEngine._compact(astStr) === TextEvidenceEngine._compact(domStr);
        const unicodeNormalizedMatch = astStr.normalize('NFC') === domStr.normalize('NFC');

        const substitutionCount = TextEvidenceEngine._countSubstitutions(astStr, domStr);

        const astFingerprint = `sha256:${TextEvidenceEngine._hash(astStr)}`;
        const domFingerprint = `sha256:${TextEvidenceEngine._hash(domStr)}`;

        return Object.freeze({
            astLength,
            domLength,
            exactMatch,
            lengthDifference,
            whitespaceDelta,
            compactedMatch,
            unicodeNormalizedMatch,
            substitutionCount,
            astFingerprint,
            domFingerprint
        });
    }
}

module.exports = TextEvidenceEngine;