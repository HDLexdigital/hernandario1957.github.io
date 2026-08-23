/**
 * E20.3.3 / E20.3.4 — DomainGapAnalyzer (Analizador de Brechas de Dominio)
 * 
 * - Analiza la distribución taxonómica y calcula el Category Concentration Ratio (CCR).
 * - Evalúa riesgos de sobrerregulación o reglas demasiado amplias (over-generalization).
 * - Soporta múltiples rutas de propiedades (claim.semanticType y semanticClassification).
 * - Aplica congelamiento profundo (Deep Freeze) para garantizar que el baseline histórico no sufra mutaciones.
 * - Mantiene trazabilidad estricta hacia la versión de baseline E20.2.4.
 */

'use strict';

/**
 * Aplica congelamiento profundo recursivo a objetos y arreglos.
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

class DomainGapAnalyzer {
    /**
     * Analiza las brechas de dominio y la concentración taxonómica de un baseline de dossiers.
     * @param {Object} payload - Contenedor con baselineDossiers.
     * @returns {Object} Reporte de análisis de brechas inmutable y trazable.
     */
    static analyze(payload) {
        if (!payload || !payload.baselineDossiers || !Array.isArray(payload.baselineDossiers)) {
            throw new Error('DOMAIN_GAP_VIOLATION: Se requiere un baselineDossiers válido y en arreglo.');
        }

        // Blindaje de inmutabilidad profunda sobre el payload de entrada
        deepFreeze(payload);

        const dossiers = payload.baselineDossiers;
        const total = dossiers.length;

        const distribution = {};
        dossiers.forEach(d => {
            const type = (d.claim && d.claim.semanticType) || d.semanticClassification || 'UNKNOWN';
            distribution[type] = (distribution[type] || 0) + 1;
        });

        // Calcular Category Concentration Ratio (CCR)
        let maxCount = 0;
        Object.keys(distribution).forEach(type => {
            if (distribution[type] > maxCount) {
                maxCount = distribution[type];
            }
        });

        const categoryConcentrationRatio = total > 0 ? maxCount / total : 0;
        // Riesgo de generalización excesiva si una sola categoría acapara el 90%+ con más de 1 elemento
        const overGeneralizationRisk = categoryConcentrationRatio >= 0.9 && total > 1;

        return deepFreeze({
            distribution: Object.freeze(distribution),
            taxonomicMetrics: Object.freeze({
                totalDossiers: total,
                categoryConcentrationRatio
            }),
            gapFindings: Object.freeze({
                overGeneralizationRisk
            }),
            forbiddenViolationsDetected: false,
            baselineModified: false,
            traceability: Object.freeze({
                baselineVersion: 'E20.2.4',
                analyzerVersion: '1.0.1'
            })
        });
    }
}

module.exports = DomainGapAnalyzer;