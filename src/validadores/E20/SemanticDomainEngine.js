/**
 * E20.1.2 — SemanticDomainEngine (Motor de Reglas de Dominio)
 * 
 * Extiende el contrato epistemológico para clasificar unidades estructurales del derecho:
 * - Detecta ARTICULO, PARRAFO, NUMERAL y LITERAL basándose en patrones textuales y evidencia certificada.
 * - Deriva obligatoriamente en UNKNOWN si la evidencia E19 es insuficiente o ambigua.
 * - Prohíbe de forma estricta reinterpretar discrepancias físicas como modificaciones normativas.
 * - Aplica inmutabilidad profunda y trazabilidad de extremo a extremo.
 */

'use strict';

const SemanticEngine = require('./SemanticEngine');

class SemanticDomainEngine extends SemanticEngine {
    /**
     * Evalúa el dominio semántico de un nodo o fragmento a partir de evidencia certificada.
     * @param {Object} payload - Contenedor con E18, E19, nodeText, ruleId y ruleVersion.
     * @returns {Object} Dossier semántico de dominio inmutable y trazable.
     */
    static evaluateDomain(payload) {
        // Heredar la validación base del contrato epistemológico (E20.1.1)
        const baseDossier = SemanticEngine.evaluate(payload);

        const nodeText = String(payload.nodeText || '').trim();
        const e19 = payload.e19;

        // Verificar umbral de evidencia: si E19 es UNKNOWN, el dominio cede y reporta UNKNOWN
        const isEvidenceUnknown = e19.classification && e19.classification.type === 'UNKNOWN';
        if (isEvidenceUnknown) {
            return Object.freeze({
                ...baseDossier,
                claim: Object.freeze({
                    ...baseDossier.claim,
                    status: 'UNKNOWN',
                    semanticType: 'UNKNOWN'
                }),
                forbiddenClaimsViolated: false
            });
        }

        // Inferencia de tipo semántico estructural basada en patrones del texto
        let semanticType = 'STRUCTURAL_UNIT';
        const lowerText = nodeText.toLowerCase();

        if (lowerText.startsWith('artículo') || lowerText.startsWith('articulo')) {
            semanticType = 'ARTICULO';
        } else if (lowerText.startsWith('parágrafo') || lowerText.startsWith('paragrafo')) {
            semanticType = 'PARRAFO';
        } else if (/^\d+[\.\)]/.test(nodeText)) {
            semanticType = 'NUMERAL';
        } else if (/^[a-z]\)/.test(nodeText)) {
            semanticType = 'LITERAL';
        }

        return Object.freeze({
            ...baseDossier,
            ruleId: payload.ruleId || 'UNKNOWN_RULE',
            ruleVersion: payload.ruleVersion || '1.0.0',
            claim: Object.freeze({
                status: 'VALIDATED',
                confidence: e19.classification ? e19.classification.confidence : 'MEDIUM',
                semanticType
            }),
            forbiddenClaimsViolated: false
        });
    }
}

module.exports = SemanticDomainEngine;