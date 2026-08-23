/**
 * E20.6.1 — CrossBoundaryEngine (Motor de Observación Transfronteriza)
 * 
 * - Detecta y analiza nodos en el AST que quedan fuera del rango certificado por E20.5.
 * - Prohíbe inferir relaciones semánticas por proximidad visual o posicional (REJECTED_PROXIMITY_INFERENCE).
 * - UNKNOWN significa que la evidencia en la frontera no justifica afirmar una estructura, no ausencia.
 * - Garantiza trazabilidad desde el nodo AST cruzando las fronteras históricas.
 * - No modifica el dossier E20.5 (ATOMIC_BLOCK permanece inmutable).
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

class CrossBoundaryEngine {
    /**
     * Observa la frontera exterior de un dossier estructural para detectar evidencia adyacente.
     * @param {Object} payload - Contenedor con baseStructuralDossier, fullAST y evaluationVersion.
     * @returns {Object} Reporte de observación de fronteras trazable e inmutable.
     */
    static observeBoundary(payload) {
        if (!payload || !payload.baseStructuralDossier || !payload.fullAST) {
            throw new Error('CROSS_BOUNDARY_CONTRACT_VIOLATION: Se requiere el dossier estructural base y el AST completo.');
        }

        const baseDossier = payload.baseStructuralDossier;
        const fullAST = payload.fullAST;

        // Extraer de forma segura el rango original E18
        const e18Ref = baseDossier.traceability &&
                       baseDossier.traceability.baseDossierRef &&
                       baseDossier.traceability.baseDossierRef.traceability &&
                       baseDossier.traceability.baseDossierRef.traceability.e18EvidenceRef;

        if (!e18Ref || !e18Ref.astRange) {
            throw new Error('CROSS_BOUNDARY_CONTRACT_VIOLATION: No se encontró el rango AST E18 en la trazabilidad del dossier.');
        }

        const [start, end] = e18Ref.astRange;
        const observedOutsideRange = [];
        const nodesAnalysis = [];

        // Ventana de observación: Revisamos los nodos inmediatamente posteriores al final del rango E20.5
        for (let i = end + 1; i < fullAST.length; i++) {
            const node = fullAST[i];
            if (!node || !node.normalizedText) continue;

            // Acotar la observación a un umbral razonable para evitar barrer todo el documento por error
            if (i > end + 5) break; 

            observedOutsideRange.push(i);
            const text = node.normalizedText;

            // Detección léxica explícita inicial (sin afirmar relación todavía)
            const hasExplicitMarker = /\b(?:parágrafo|paragrafo)\b/i.test(text) || 
                                      /^\s*\d+[\.\)]\s/.test(text) || 
                                      /^\s*[a-z]\)\s/.test(text);

            nodesAnalysis.push({
                astIndex: i,
                // Aplicar la prohibición contractual de inferencia por proximidad
                structuralLink: hasExplicitMarker ? 'CANDIDATE_LINK' : 'REJECTED_PROXIMITY_INFERENCE',
                // Evidencia insuficiente en la frontera deriva en UNKNOWN
                claim: hasExplicitMarker ? 'CANDIDATE_STRUCTURE' : 'UNKNOWN',
                traceability: {
                    astIndex: i,
                    boundaryIdentity: 'POST_RANGE_ADJACENT',
                    baseRange: [start, end]
                }
            });
        }

        // Clonación profunda de seguridad para proteger el veredicto ATOMIC_BLOCK de E20.5
        const clonedBaseDossier = JSON.parse(JSON.stringify(baseDossier));

        const boundaryReport = {
            ruleId: 'RULE_CROSS_BOUNDARY_OBSERVATION',
            ruleVersion: payload.evaluationVersion || '1.0.0',
            boundaryObservation: {
                hasAdjacentNodes: observedOutsideRange.length > 0,
                observedOutsideRange: observedOutsideRange,
                structuralStatus: 'PENDING_EXPLICIT_EVIDENCE', // Jamás inferir 'ASSUMED_CHILD'
                nodesAnalysis: nodesAnalysis
            },
            traceability: {
                e20_5_Ref: clonedBaseDossier
            }
        };

        return deepFreeze(boundaryReport);
    }
}

module.exports = CrossBoundaryEngine;