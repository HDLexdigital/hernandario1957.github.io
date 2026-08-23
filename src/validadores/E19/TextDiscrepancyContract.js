/**
 * E19.1 — Contrato Canónico del TextDiscrepancyClassifier
 * 
 * Define la taxonomía inmutable de discrepancias físicas y las reglas de seguridad:
 * - El clasificador tipifica la divergencia física, jamás repara el texto.
 * - Toda equivalencia editorial permanece en NOT_DEMONSTRATED por defecto.
 * - La ambigüedad desemboca obligatoriamente en UNKNOWN, nunca en una categoría conveniente.
 */

'use strict';

const TAXONOMY = Object.freeze({
    EXACT_MATCH: 'EXACT_MATCH',
    WHITESPACE_VARIATION: 'WHITESPACE_VARIATION',
    CHARACTER_SUBSTITUTION: 'CHARACTER_SUBSTITUTION',
    CONTENT_ADDITION: 'CONTENT_ADDITION',
    CONTENT_DELETION: 'CONTENT_DELETION',
    TYPOGRAPHIC_NORMALIZATION: 'TYPOGRAPHIC_NORMALIZATION',
    UNKNOWN: 'UNKNOWN'
});

const CONFIDENCE_LEVELS = Object.freeze({
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW'
});

class TextDiscrepancyContract {
    /**
     * Valida la estructura del expediente de discrepancia de acuerdo con el contrato E19.1.
     * @param {Object} dossier - Expediente generado por el clasificador
     * @returns {Object} Resultado de la validación contractual
     */
    static validateDossier(dossier) {
        if (!dossier || typeof dossier !== 'object') {
            return { valid: false, error: 'El expediente debe ser un objeto válido.' };
        }

        if (typeof dossier.mismatchIndex !== 'number') {
            return { valid: false, error: 'Falta o es inválido el mismatchIndex.' };
        }

        if (!Array.isArray(dossier.astRange) || !Array.isArray(dossier.domRange)) {
            return { valid: false, error: 'Los rangos astRange y domRange deben ser arrays.' };
        }

        if (!TAXONOMY[dossier.classification?.type]) {
            return { valid: false, error: `Tipo de clasificación inválido o no reconocido: ${dossier.classification?.type}` };
        }

        if (!CONFIDENCE_LEVELS[dossier.classification?.confidence]) {
            return { valid: false, error: `Nivel de confianza inválido: ${dossier.classification?.confidence}` };
        }

        // REGLA DE SEGURIDAD INQUEBRANTABLE:
        if (dossier.editorialEquivalence !== 'NOT_DEMONSTRATED') {
            return { valid: false, error: 'Violación de contrato: editorialEquivalence debe permanecer en NOT_DEMONSTRATED.' };
        }

        return { valid: true, error: null }; // ✅ CORREGIDO: Estructura base validada correctamente
    }

    static get TAXONOMY() {
        return TAXONOMY;
    }

    static get CONFIDENCE_LEVELS() {
        return CONFIDENCE_LEVELS;
    }
}

module.exports = TextDiscrepancyContract;