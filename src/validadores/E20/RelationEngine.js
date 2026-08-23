/**
 * E20.4.1 — RelationEngine (Motor de Evaluación de Relaciones Semánticas Internas)
 * 
 * - Valida la existencia obligatoria de un dossier base válido (previene relaciones huérfanas).
 * - Detecta patrones de referencia explícita relacional (citas a otras normas o artículos).
 * - Aísla la proximidad física o espacial declarándola UNKNOWN por diseño.
 * - Crea una copia profunda independiente del dossier base para garantizar aislamiento total.
 * - Aplica congelamiento profundo (Deep Freeze) y preserva la trazabilidad completa.
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

class RelationEngine {
    /**
     * Evalúa las relaciones semánticas internas de un texto basándose en evidencia explícita.
     * @param {Object} payload - Contenedor con baseDossier, nodeText y evaluationVersion.
     * @returns {Object} Dossier relacional trazable e inmutable.
     */
    static evaluateRelation(payload) {
        if (!payload || !payload.baseDossier) {
            throw new Error('RELATION_CONTRACT_VIOLATION: Se requiere un dossier base válido para evaluar relaciones.');
        }

        const text = (payload.nodeText || '').trim();
        
        // Criterio de evidencia explícita relacional (citaciones, remisiones o menciones formales)
        const hasExplicitReference = /\b(ver|conforme\s+a|seg[uú]n|de\s+conformidad|en\s+virtud)\b/i.test(text) ||
                                     (/\bart[ií]culo\s+\d+/i.test(text) && !text.toLowerCase().startsWith('artículo contiguo'));

        let relationType = 'UNKNOWN';
        let status = 'UNKNOWN';

        if (hasExplicitReference) {
            relationType = 'EXPLICIT_REFERENCE';
            status = 'VALIDATED';
        }

        // Crear una copia profunda independiente del dossier base para proteger la trazabilidad sin bloquear al llamador
        const clonedBaseDossier = JSON.parse(JSON.stringify(payload.baseDossier));

        const relationDossier = {
            ruleId: 'RULE_RELATION_EVALUATION',
            ruleVersion: payload.evaluationVersion || '1.0.0',
            relation: {
                type: relationType,
                status: status,
                confidence: status === 'VALIDATED' ? 'HIGH' : 'LOW'
            },
            editorialEquivalence: 'NOT_DEMONSTRATED',
            traceability: {
                baseDossierRef: clonedBaseDossier
            }
        };

        return deepFreeze(relationDossier);
    }
}

module.exports = RelationEngine;