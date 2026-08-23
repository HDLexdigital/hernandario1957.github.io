/**
 * E22.4.1 — AccessibilityValidator (Auditor Semántico y de Accesibilidad)
 * 
 * - Validador estrictamente Read-Only para cadenas XHTML.
 * - Verifica la unicidad de identificadores DOM (ID).
 * - Audita la existencia de atributos obligatorios de procedencia (data-ld-e18) en nodos raíz.
 * - Castiga antipatrones de accesibilidad (ARIA redundancy).
 * - Retorna un reporte inmutable con status: PASS, FAIL o WARNING.
 */

'use strict';

/**
 * Aplica congelamiento profundo recursivo para garantizar inmutabilidad.
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

class AccessibilityValidator {
    /**
     * Audita una cadena de texto XHTML en busca de violaciones semánticas o de accesibilidad.
     * @param {string} xhtmlString - El documento o fragmento XHTML a validar.
     * @returns {Object} Reporte de auditoría (status, errors, warnings).
     */
    static audit(xhtmlString) {
        if (typeof xhtmlString !== 'string') {
            throw new Error('VALIDATOR_INPUT_VIOLATION: El validador exige una cadena de texto (string) XHTML cruda.');
        }

        const errors = [];
        const warnings = [];

        // 1. Integridad Estructural: Unicidad de IDs
        const idRegex = /id="([^"]+)"/g;
        const foundIds = new Set();
        let idMatch;
        while ((idMatch = idRegex.exec(xhtmlString)) !== null) {
            const id = idMatch[1];
            if (foundIds.has(id)) {
                errors.push({ code: 'DUPLICATE_ID', message: `Violación estructural: ID duplicado detectado ('${id}').` });
            } else {
                foundIds.add(id);
            }
        }

        // 2. Extracción de nodos raíz <article> para validación de procedencia y semántica
        const articleRegex = /<article([^>]*)>/gi;
        let articleMatch;
        while ((articleMatch = articleRegex.exec(xhtmlString)) !== null) {
            const attributes = articleMatch[1];

            // Provenance Contract: Un raíz DEBE tener su pasaporte topológico
            if (!attributes.includes('data-ld-e18=')) {
                errors.push({ 
                    code: 'MISSING_PROVENANCE_ROOT', 
                    message: 'Violación de custodia: Nodo <article> carece del atributo de procedencia data-ld-e18.' 
                });
            }

            // Semantic Contract: Uso redundante de ARIA (No ARIA is better than bad ARIA)
            if (attributes.includes('role="article"')) {
                warnings.push({ 
                    code: 'REDUNDANT_ARIA_ROLE', 
                    message: 'Antipatrón de accesibilidad: Uso redundante de role="article" en un elemento <article> nativo.' 
                });
            }
        }

        // 3. Consolidación de estado Read-Only
        let status = 'PASS';
        if (errors.length > 0) {
            status = 'FAIL';
        } else if (warnings.length > 0) {
            status = 'WARNING';
        }

        const auditReport = {
            metadata: {
                validatorVersion: '1.0.0',
                timestamp: new Date().toISOString()
            },
            status: status,
            errors: errors,
            warnings: warnings
        };

        return deepFreeze(auditReport);
    }
}

module.exports = AccessibilityValidator;