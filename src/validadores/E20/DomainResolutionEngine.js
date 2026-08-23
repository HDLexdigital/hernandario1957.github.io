/**
 * E20.3.5 — DomainResolutionEngine (Motor de Resolución Taxonómica Refinada)
 * 
 * - Aplica patrones de evidencia explícita para distinguir ARTICULO, PARRAFO, NUMERAL y LITERAL.
 * - Implementa el principio de no absorción por contenedor: descarta la clasificación automática 
 *   como ARTICULO para fragmentos internos sin cabecera formal.
 * - Deriva obligatoriamente en UNKNOWN ante patrones ambiguos o insuficientes.
 * - Aplica congelamiento profundo (Deep Freeze) y preserva intacta la trazabilidad de E18 y E19.
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

class DomainResolutionEngine {
    /**
     * Resuelve la entidad semántica de alta granularidad para un nodo de texto y su evidencia asociada.
     * @param {Object} input - Contenedor con e18, e19, nodeText y ruleVersion.
     * @returns {Object} Dossier semántico resuelto, trazable e inmutable.
     */
    static resolve(input) {
        if (!input || !input.e18 || !input.e19) {
            throw new Error('E20.RESOLUTION_VIOLATION: Se requieren expedientes E18 y E19 válidos.');
        }

        const text = (input.nodeText || '').trim();
        let semanticType = 'UNKNOWN';
        let status = 'UNKNOWN';

        // Reglas de evidencia explícita de alta granularidad
        const articuloPattern = /^[\s\uFEFF\xA0]*(?:artículo|articulo)\b/i;
        const paragrafoPattern = /^[\s\uFEFF\xA0]*(?:parágrafo|paragrafo)\b/i;
        const numeralPattern = /^[\s\uFEFF\xA0]*\d+[\.\)]/i;
        const literalPattern = /^[\s\uFEFF\xA0]*[a-z]\)/i;

        if (articuloPattern.test(text)) {
            semanticType = 'ARTICULO';
            status = 'VALIDATED';
        } else if (paragrafoPattern.test(text)) {
            semanticType = 'PARRAFO';
            status = 'VALIDATED';
        } else if (numeralPattern.test(text)) {
            semanticType = 'NUMERAL';
            status = 'VALIDATED';
        } else if (literalPattern.test(text)) {
            semanticType = 'LITERAL';
            status = 'VALIDATED';
        } else {
            // Principio de no absorción por contenedor: si no hay cabecera explícita, se rechaza ARTICULO y va a UNKNOWN
            semanticType = 'UNKNOWN';
            status = 'UNKNOWN';
        }

        const resolvedDossier = {
            ruleId: input.ruleId || 'RULE_DOMAIN_RESOLUTION_REFINED',
            ruleVersion: input.ruleVersion || '2.0.0',
            claim: {
                status,
                semanticType,
                confidence: status === 'VALIDATED' ? 'HIGH' : 'LOW'
            },
            editorialEquivalence: input.e19.editorialEquivalence || 'NOT_DEMONSTRATED',
            traceability: {
                e18EvidenceRef: input.e18,
                e19EvidenceRef: input.e19
            }
        };

        return deepFreeze(resolvedDossier);
    }
}

module.exports = DomainResolutionEngine;