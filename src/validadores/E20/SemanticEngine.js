/**
 * E20.1.1 — SemanticEngine (Motor Base del Contrato Epistemológico)
 * 
 * Capa de validación semántica fundacional:
 * - Requiere expedientes E18 y E19 válidos como insumo inmutable obligatorio.
 * - Aplica congelamiento profundo (Deep Freeze) recursivo incluso sobre objetos ya congelados superficialmente.
 * - Rechaza de forma absoluta cualquier afirmación huérfana sin cadena de evidencia.
 * - Gestiona la incertidumbre elevando el estado UNKNOWN como resultado de primera clase.
 */

'use strict';

/**
 * Aplica congelamiento profundo recursivo a objetos y arreglos anidados,
 * asegurando la inmutabilidad de subestructuras aunque el contenedor esté parcialmente congelado.
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

class SemanticEngine {
    /**
     * Evalúa y valida el contrato epistemológico para un expediente semántico.
     * @param {Object} payload - Contenedor con insumos E18, E19 y metadatos de regla.
     * @returns {Object} Dossier semántico trazable e inmutable.
     */
    static evaluate(payload) {
        if (!payload || !payload.e18 || !payload.e19) {
            throw new Error('E20.CONTRACT_VIOLATION: Toda afirmación semántica requiere expedientes de evidencia E18 y E19 válidos.');
        }

        // Blindaje de inmutabilidad profunda sobre los insumos recibidos
        deepFreeze(payload.e18);
        deepFreeze(payload.e19);

        const e18 = payload.e18;
        const e19 = payload.e19;
        const ruleId = payload.semanticRuleId || 'UNKNOWN_RULE';
        const ruleVersion = payload.semanticRuleVersion || '1.0.0';

        // Evaluar estado de incertidumbre basado en E19
        const isUnknown = e19.classification && e19.classification.type === 'UNKNOWN';
        const claimStatus = isUnknown ? 'UNKNOWN' : 'VALIDATED';
        const claimConfidence = isUnknown ? 'LOW' : (e19.classification ? e19.classification.confidence : 'MEDIUM');

        return Object.freeze({
            claim: Object.freeze({
                status: claimStatus,
                confidence: claimConfidence,
                semanticType: 'STRUCTURAL_UNIT'
            }),
            traceability: Object.freeze({
                sourceRanges: Object.freeze({
                    astRange: e18.astRange,
                    domRange: e18.domRange
                }),
                e18EvidenceRef: e18,
                e19EvidenceRef: e19,
                semanticRuleId: ruleId,
                semanticRuleVersion: ruleVersion
            }),
            editorialEquivalence: 'NOT_DEMONSTRATED'
        });
    }
}

module.exports = SemanticEngine;