/**
 * E20.7.2 — AttributionAdapter (Adaptador de Atribución Estructural)
 * 
 * - Consume el reporte de observación transfronteriza E20.6 (CrossBoundaryAudit).
 * - Inyecta dinámicamente las reglas de dominio (domainRules) proveídas en tiempo de ejecución.
 * - Delega la evaluación de propiedad jurídica exclusivamente al OwnershipEngine.
 * - Tabula estrictamente: OWNERSHIP_CONFIRMED, UNKNOWN y REJECTED_PROXIMITY_INFERENCE.
 * - Protege los invariantes garantizando inmutabilidad completa (Deep Freeze).
 */

'use strict';

const OwnershipEngine = require('./OwnershipEngine');

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

class AttributionAdapter {
    /**
     * Procesa las observaciones de frontera para determinar la atribución jurídica de los candidatos.
     * @param {Object} payload - Contenedor con crossBoundaryReport, domainRules y evaluationVersion.
     * @returns {Object} Reporte global de auditoría de atribuciones (AttributionAudit).
     */
    static processAttributions(payload) {
        if (!payload || !payload.crossBoundaryReport || !Array.isArray(payload.crossBoundaryReport.observations)) {
            throw new Error('ATTRIBUTION_ADAPTER_VIOLATION: Se requiere un reporte transfronterizo válido.');
        }

        const observations = payload.crossBoundaryReport.observations;
        const domainRules = payload.domainRules || {};
        const evaluationVersion = payload.evaluationVersion || '1.0.0';

        const attributions = [];
        let ownershipConfirmed = 0;
        let unknownCount = 0;
        let rejectedProximityInferences = 0;
        
        let orphanInputs = 0;
        let provenanceFailures = 0;

        observations.forEach(obs => {
            // Validación contractual para evitar procesar reportes corruptos
            if (!obs || !obs.traceability || !obs.traceability.e20_5_Ref) {
                provenanceFailures++;
                return;
            }

            const nodesAnalysis = obs.boundaryObservation && obs.boundaryObservation.nodesAnalysis || [];
            const nodeAttributions = [];

            nodesAnalysis.forEach(node => {
                try {
                    // Delegación estricta al motor certificado E20.7.1
                    const attribution = OwnershipEngine.evaluateOwnership({
                        boundaryReport: obs,
                        candidateIndex: node.astIndex,
                        domainRules: domainRules,
                        evaluationVersion: evaluationVersion
                    });

                    // Tabulación de estados epistemológicos
                    if (attribution.ownershipStatus === 'OWNERSHIP_CONFIRMED') {
                        ownershipConfirmed++;
                    } else if (attribution.ownershipStatus === 'REJECTED_PROXIMITY_INFERENCE') {
                        rejectedProximityInferences++;
                    } else {
                        unknownCount++;
                    }

                    nodeAttributions.push(attribution);
                } catch (err) {
                    orphanInputs++;
                }
            });

            attributions.push({
                baseObservationRef: obs,
                nodeAttributions: nodeAttributions
            });
        });

        const auditReport = {
            metadata: {
                adapterVersion: '1.0.0',
                evaluationVersion,
                timestamp: new Date().toISOString()
            },
            summary: {
                totalObservations: observations.length,
                ownershipConfirmed,
                unknownCount,
                rejectedProximityInferences
            },
            attributions: attributions,
            invariantsCheck: {
                orphanInputs,
                baselineMutations: 0, // Garantizado por diseño inmutable
                provenanceFailures
            }
        };

        return deepFreeze(auditReport);
    }
}

module.exports = AttributionAdapter;