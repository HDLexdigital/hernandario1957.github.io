/**
 * E21.1 — ReconstitutionEngine (Motor de Reconstitución y Síntesis)
 * 
 * - Genera una estructura derivada (Tree Reconstitution) basada EXCLUSIVAMENTE en evidencia E20.7.
 * - Transforma dictámenes OWNERSHIP_CONFIRMED en relaciones parent->children.
 * - Restringe afirmaciones: Lanza UNAUTHORIZED_SYNTHESIS_CLAIM si se intenta inyectar un estado no certificado.
 * - Preserva inmutabilidad: El nodo sintetizado envuelve la evidencia fuente (sourceEvidence) 
 *   y la regla jurídica (ownershipEvidence) sin alterar los objetos originales.
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

class ReconstitutionEngine {
    /**
     * Sintetiza un nodo del árbol derivado aplicando las atribuciones certificadas.
     * @param {Object} payload - Contenedor con baseDossierId, attributions y originalASTNodes.
     * @returns {Object} Nodo derivado inmutable.
     */
    static synthesizeNode(payload) {
        if (!payload) {
            throw new Error('RECONSTITUTION_CONTRACT_VIOLATION: Payload requerido.');
        }

        const { baseDossierId, attributions = [], originalASTNodes = {} } = payload;
        const children = [];

        attributions.forEach(attr => {
            const status = attr.ownershipStatus;

            // Silencio epistemológico: estados válidos que NO autorizan jerarquía
            if (status === 'UNKNOWN' || status === 'REJECTED_PROXIMITY_INFERENCE') {
                return; 
            }

            // Autorización explícita para materializar la estructura
            if (status === 'OWNERSHIP_CONFIRMED') {
                const astIndex = attr.traceability && attr.traceability.astIndex;
                const originalNode = originalASTNodes[astIndex];

                if (!originalNode) {
                    throw new Error(`RECONSTITUTION_CONTRACT_VIOLATION: Nodo original no encontrado para índice ${astIndex}.`);
                }

                // E21 materializa la estructura pero envuelve la prueba. 
                // Ninguna propiedad del AST original es mutada.
                const child = {
                    sourceEvidence: {
                        astIndex: astIndex,
                        text: originalNode.normalizedText
                    },
                    ownershipEvidence: {
                        rule: attr.appliedRule
                    },
                    provenance: {
                        e20_7_Ref: attr // Puntero a la evidencia inmutable de E20.7
                    }
                };

                children.push(child);
            } else {
                // Invariante: E21 claims ⊆ authorized E20.7 claims
                throw new Error(`UNAUTHORIZED_SYNTHESIS_CLAIM: Intento de sintetizar con estatus no certificado: '${status}'`);
            }
        });

        const derivedNode = {
            baseDossierId: baseDossierId,
            children: children
        };

        return deepFreeze(derivedNode);
    }
}

module.exports = ReconstitutionEngine;