/**
 * E20.2.1 — SemanticEvidenceAdapter (Adaptador de Evidencia Semántica)
 * 
 * - Unifica expedientes certificados E18 y E19 dentro de un dossier semántico de ejecución.
 * - Aplica validación estricta de insumos requeridos.
 * - Garantiza inmutabilidad profunda (Deep Freeze) del paquete adaptado.
 * - Impide estrictamente la generación de afirmaciones normativas automáticas.
 */

'use strict';

const SemanticDomainEngine = require('./SemanticDomainEngine');

class SemanticEvidenceAdapter {
    /**
     * Adapta y unifica expedientes E18 y E19 en un dossier semántico de ejecución trazable.
     * @param {Object} input - Contenedor con e18, e19, nodeText y contextId opcional.
     * @returns {Object} Dossier semántico unificado e inmutable.
     */
    static adapt(input) {
        if (!input || !input.e18 || !input.e19) {
            throw new Error('E20.ADAPTER_VIOLATION: El adaptador requiere expedientes E18 y E19 válidos obligatoriamente.');
        }

        // Delegar la evaluación al motor de dominio existente para mantener coherencia de contrato
        const domainResult = SemanticDomainEngine.evaluateDomain({
            e18: input.e18,
            e19: input.e19,
            nodeText: input.nodeText || '',
            ruleId: input.ruleId || 'ADAPTER_RULE_DEFAULT',
            ruleVersion: input.ruleVersion || '1.0.0'
        });

        // Construir el dossier adaptado de ejecución
        const executionDossier = {
            contextId: input.contextId || 'DEFAULT_CONTEXT',
            ...domainDataSanitized(domainResult)
        };

        return deepFreeze(executionDossier);
    }
}

/**
 * Filtra propiedades no autorizadas (como hipotéticos cambios normativos) de los datos del dominio.
 * @private
 */
function domainDataSanitized(domainResult) {
    const raw = { ...domainResult };
    // Asegurar por diseño que ninguna afirmación normativa no autorizada se filtre
    if (raw.claim && 'normativeChange' in raw.claim) {
        delete raw.claim.normativeChange;
    }
    return raw;
}

/**
 * Congelamiento profundo recursivo para garantizar inmutabilidad total del dossier adaptado.
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

module.exports = SemanticEvidenceAdapter;