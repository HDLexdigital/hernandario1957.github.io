/**
 * E20.5.1 — InternalStructureEngine (Motor de Resolución de Estructura Interna)
 * 
 * - Separa el encabezado del artículo del cuerpo para evitar confusiones con el número del artículo.
 * - Analiza la composición interna basándose estrictamente en evidencia léxica explícita.
 * - Distingue ATOMIC_BLOCK (bloque continuo sin divisiones) de UNKNOWN.
 * - Detecta subcomponentes formales (PARRAFO, NUMERAL, LITERAL) mediante patrones textuales reconocidos.
 * - Aplica congelamiento profundo (Deep Freeze) y clonación defensiva para proteger el dossier base.
 */

'use strict';

/**
 * Aplica congelamiento profundo recursivo para garantizar inmutabilidad total.
 * @private
 */
function deepFreeze(obj) {
    if (obj && typeof obj === 'object') {
        if (!Object.isFrozen(obj)) {
            Object.freeze(obj);
        }
        Object.getOwnPropertyNames(obj).forEach(prop => {
            deepFreeze(obj[prop]);
        });
    }
    return obj;
}

class InternalStructureEngine {
    /**
     * Resuelve la estructura interna de un texto basándose en evidencia explícita.
     * @param {Object} payload - Contenedor con baseDossier, nodeText y evaluationVersion.
     * @returns {Object} Dossier de estructura interna trazable e inmutable.
     */
    static resolveStructure(payload) {
        if (!payload || !payload.baseDossier) {
            throw new Error('INTERNAL_STRUCTURE_VIOLATION: Se requiere un dossier base válido.');
        }

        const text = (payload.nodeText || '').trim();
        const subComponents = [];

        // Aislar el encabezado del artículo (ej: "Artículo 10. ") para que no interfiera con los numerales del cuerpo
        const headerMatch = text.match(/^(?:artículo|articulo)\s+\d+[º°a-z]?[\.\s]*/i);
        const searchStartIndex = headerMatch ? headerMatch[0].length : 0;
        const bodyText = text.substring(searchStartIndex);

        // Patrones de detección léxica explícita sobre el cuerpo del artículo
        const paragrafoRegex = /\b(?:parágrafo|paragrafo)\b\.?/gi;
        const numeralRegex = /\b\d+[\.\)]\s+/g;
        const literalRegex = /\b[a-z]\)\s+/g;

        let match;
        while ((match = paragrafoRegex.exec(bodyText)) !== null) {
            subComponents.push({ type: 'PARRAFO', marker: match[0], index: match.index + searchStartIndex });
        }
        while ((match = numeralRegex.exec(bodyText)) !== null) {
            subComponents.push({ type: 'NUMERAL', marker: match[0].trim(), index: match.index + searchStartIndex });
        }
        while ((match = literalRegex.exec(bodyText)) !== null) {
            subComponents.push({ type: 'LITERAL', marker: match[0].trim(), index: match.index + searchStartIndex });
        }

        let mainType = 'ATOMIC_BLOCK';
        if (subComponents.length > 0) {
            mainType = 'COMPOSITE_BLOCK';
        } else if (text.length < 5 || /\b(?:truncado|indefinido)\b/i.test(text)) {
            mainType = 'UNKNOWN';
        }

        // Clonación profunda de seguridad para proteger el dossier base
        const clonedBaseDossier = JSON.parse(JSON.stringify(payload.baseDossier));

        const structuralDossier = {
            ruleId: 'RULE_INTERNAL_STRUCTURE_RESOLUTION',
            ruleVersion: payload.evaluationVersion || '1.0.0',
            composition: {
                type: mainType,
                subComponents: subComponents
            },
            editorialEquivalence: 'NOT_DEMONSTRATED',
            traceability: {
                baseDossierRef: clonedBaseDossier
            }
        };

        return deepFreeze(structuralDossier);
    }
}

module.exports = InternalStructureEngine;