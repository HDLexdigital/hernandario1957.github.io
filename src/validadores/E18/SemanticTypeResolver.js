/**
 * E18.2.x.1 — SemanticTypeResolver (Actualizado con Trazabilidad Completa)
 * Resolvedor puro y determinista de semántica respaldado por SemanticRuleRegistry.
 * Cero heurísticas, trazabilidad extendida obligatoria (sourceType, field, matchedToken, ruleId).
 */

'use strict';

const SemanticRuleRegistry = require('./SemanticRuleRegistry');

class SemanticTypeResolver {
    /**
     * Resuelve el tipo semántico y el tipo de nodo a partir de evidencia local.
     * Respeta estrictamente la precedencia: estiloParrafo -> tipo -> tipoNodo (para AST).
     * 
     * @param {Object} evidence - Objeto de evidencia local (AST o XHTML)
     * @returns {Object} Veredicto normativo estructurado
     */
    static resolve(evidence) {
        const defaultResult = {
            semanticType: null,
            nodeKind: 'text',
            confidence: 'NOT_DEMONSTRATED',
            evidence: {
                ruleId: null,
                sourceType: null,
                field: null,
                matchedToken: null
            }
        };

        if (!evidence || typeof evidence !== 'object') {
            return defaultResult;
        }

        const sourceType = evidence.sourceType;

        if (sourceType === 'AST') {
            // Precedencia estricta: estiloParrafo -> tipo -> tipoNodo
            const fieldsToCheck = ['estiloParrafo', 'tipo', 'tipoNodo'];
            for (const field of fieldsToCheck) {
                const tokenValue = evidence[field];
                if (tokenValue) {
                    const rule = SemanticRuleRegistry.findRule('AST', field, tokenValue);
                    if (rule) {
                        return {
                            semanticType: rule.semanticType,
                            nodeKind: rule.nodeKind,
                            confidence: 'DEMONSTRATED',
                            evidence: {
                                ruleId: rule.id,
                                sourceType: 'AST',
                                field: field,
                                matchedToken: tokenValue
                            }
                        };
                    }
                }
            }
        } else if (sourceType === 'XHTML') {
            const classes = evidence.classes;
            if (Array.isArray(classes)) {
                for (const cls of classes) {
                    const rule = SemanticRuleRegistry.findRule('XHTML', 'class', cls);
                    if (rule) {
                        return {
                            semanticType: rule.semanticType,
                            nodeKind: rule.nodeKind,
                            confidence: 'DEMONSTRATED',
                            evidence: {
                                ruleId: rule.id,
                                sourceType: 'XHTML',
                                field: 'class',
                                matchedToken: cls
                            }
                        };
                    }
                }
            }
        }

        return defaultResult;
    }
}

module.exports = SemanticTypeResolver;