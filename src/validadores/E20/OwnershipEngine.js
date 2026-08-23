/**
 * E20.7.1 — OwnershipEngine (Motor de Atribución Estructural)
 * 
 * - Convierte una CANDIDATE_STRUCTURE en propiedad jurídica (OWNERSHIP_CONFIRMED)
 *   ÚNICAMENTE si existe una regla de dominio explícita que demuestre dependencia.
 * - Prohíbe la atribución por proximidad, orden DOM o asunción implícita (deriva en UNKNOWN).
 * - Preserva REJECTED_PROXIMITY_INFERENCE como evidencia histórica inmutable.
 * - Rechaza la atribución si se rompe la trazabilidad (orfandad).
 * - Aplica Deep Freeze para congelar la atribución.
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

class OwnershipEngine {
    /**
     * Evalúa si una estructura candidata puede atribuirse jurídicamente al dossier precedente.
     * @param {Object} payload - Contenedor con boundaryReport, candidateIndex, domainRules y evaluationVersion.
     * @returns {Object} Expediente de atribución estructural inmutable.
     */
    static evaluateOwnership(payload) {
        if (!payload || !payload.boundaryReport) {
            throw new Error('OWNERSHIP_CONTRACT_VIOLATION: Se requiere un reporte de fronteras (boundaryReport).');
        }

        const { boundaryReport, candidateIndex, domainRules, evaluationVersion } = payload;
        
        // Validación de no orfandad: Debe existir un linaje hasta E20.5
        const e20_5_Ref = boundaryReport.traceability && boundaryReport.traceability.e20_5_Ref;
        if (!e20_5_Ref) {
            throw new Error('OWNERSHIP_CONTRACT_VIOLATION: Atribución huérfana. Falta trazabilidad hacia el dossier propietario E20.5.');
        }

        const nodesAnalysis = boundaryReport.boundaryObservation && boundaryReport.boundaryObservation.nodesAnalysis;
        const candidateNode = nodesAnalysis && nodesAnalysis.find(n => n.astIndex === candidateIndex);

        if (!candidateNode) {
            throw new Error(`OWNERSHIP_CONTRACT_VIOLATION: No se encontró el nodo con índice AST ${candidateIndex} en el reporte de fronteras.`);
        }

        let ownershipStatus = 'UNKNOWN';
        let attributedOwner = null;
        let appliedRule = null;

        // Regla 1: Evidencia negativa histórica (Proximidad rechazada en E20.6 se mantiene rechazada)
        if (candidateNode.structuralLink === 'REJECTED_PROXIMITY_INFERENCE') {
            ownershipStatus = 'REJECTED_PROXIMITY_INFERENCE';
        } 
        // Regla 2: Candidato viable sujeto a validación por regla de dominio explícita
        else if (candidateNode.claim === 'CANDIDATE_STRUCTURE') {
            const rule = domainRules && domainRules[candidateNode.markerType];
            
            if (rule) {
                ownershipStatus = 'OWNERSHIP_CONFIRMED';
                attributedOwner = e20_5_Ref.claim; // Se le atribuye la propiedad del claim original (ej: ARTICULO)
                appliedRule = rule;
            } else {
                // Sin regla de dominio demostrable, la dependencia es desconocida.
                ownershipStatus = 'UNKNOWN';
            }
        }

        // Clonación de seguridad para proteger el baseline de E20.6
        const clonedBoundaryReport = JSON.parse(JSON.stringify(boundaryReport));

        const attributionDossier = {
            ruleId: 'RULE_STRUCTURAL_OWNERSHIP',
            ruleVersion: evaluationVersion || '1.0.0',
            ownershipStatus,
            attributedOwner,
            appliedRule,
            traceability: {
                e20_6_Ref: clonedBoundaryReport,
                astIndex: candidateIndex
            }
        };

        return deepFreeze(attributionDossier);
    }
}

module.exports = OwnershipEngine;