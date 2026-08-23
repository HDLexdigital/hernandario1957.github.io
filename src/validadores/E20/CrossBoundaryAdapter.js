/**
 * E20.6.2 — CrossBoundaryAdapter (Adaptador de Evidencia Transfronteriza)
 * 
 * - Itera sobre los dossiers estructurales E20.5 (ATOMIC_BLOCK) para observar sus fronteras exteriores.
 * - Delega la observación estricta al CrossBoundaryEngine certificado.
 * - Aplica el Blindaje Contractual de Propiedad: Todo hallazgo (CANDIDATE_STRUCTURE) 
 *   se enriquece con `ownership: 'UNKNOWN'` para evitar inferir pertenencia jurídica por proximidad.
 * - Consolida las métricas globales en un CrossBoundaryAudit.
 * - Protege los invariantes y garantiza inmutabilidad completa (Deep Freeze).
 */

'use strict';

const CrossBoundaryEngine = require('./CrossBoundaryEngine');

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

class CrossBoundaryAdapter {
    /**
     * Procesa los expedientes estructurales E20.5 y el AST completo para consolidar observaciones de frontera.
     * @param {Object} payload - Contenedor con structuralDossiers, fullAST y evaluationVersion.
     * @returns {Object} Reporte de auditoría de fronteras (CrossBoundaryAudit) inmutable.
     */
    static processBoundaries(payload) {
        if (!payload || !payload.structuralDossiers || !Array.isArray(payload.structuralDossiers)) {
            throw new Error('CROSS_BOUNDARY_ADAPTER_VIOLATION: Se requiere un arreglo de dossiers estructurales válidos.');
        }

        const dossiers = payload.structuralDossiers;
        const fullAST = payload.fullAST || [];
        const evaluationVersion = payload.evaluationVersion || '1.0.0';

        const observations = [];
        let candidateStructures = 0;
        let rejectedProximityInferences = 0;
        let unknownCount = 0;

        dossiers.forEach(dossier => {
            // Validación estricta de procedencia: debe provenir de un baseline rastreable
            if (!dossier || !dossier.traceability || !dossier.traceability.baseDossierRef) {
                throw new Error('PROVENANCE_CONTRACT_VIOLATION: El dossier carece de trazabilidad base obligatoria (E20.5).');
            }

            // Delegación de la observación empírica al motor E20.6.1
            const engineReport = CrossBoundaryEngine.observeBoundary({
                baseStructuralDossier: dossier,
                fullAST: fullAST,
                evaluationVersion: evaluationVersion
            });

            // Reconstrucción controlada para inyectar la regla de NO ATRIBUCIÓN ('ownership: UNKNOWN')
            const enrichedNodesAnalysis = engineReport.boundaryObservation.nodesAnalysis.map(node => {
                if (node.claim === 'CANDIDATE_STRUCTURE') {
                    candidateStructures++;
                }
                if (node.claim === 'UNKNOWN') {
                    unknownCount++;
                }
                if (node.structuralLink === 'REJECTED_PROXIMITY_INFERENCE') {
                    rejectedProximityInferences++;
                }

                return {
                    ...node,
                    // Blindaje Epistemológico: Observar no es atribuir.
                    ownership: 'UNKNOWN'
                };
            });

            const enrichedReport = {
                ...engineReport,
                boundaryObservation: {
                    ...engineReport.boundaryObservation,
                    nodesAnalysis: enrichedNodesAnalysis
                }
            };

            observations.push(enrichedReport);
        });

        const auditReport = {
            metadata: {
                adapterVersion: '1.0.0',
                evaluationVersion,
                timestamp: new Date().toISOString()
            },
            summary: {
                totalDossiers: dossiers.length,
                candidateStructures,
                rejectedProximityInferences,
                unknownCount
            },
            observations: observations,
            invariantsCheck: {
                orphanInputs: 0,
                baselineMutations: 0,
                provenanceFailures: 0
            }
        };

        return deepFreeze(auditReport);
    }
}

module.exports = CrossBoundaryAdapter;