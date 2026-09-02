/**
 * E22.4.1 — Accessibility & Semantic Validator Contract Suite
 * 
 * Fase: RED
 * 
 * Contrato del Validador de Accesibilidad y Semántica:
 * - Es estrictamente de solo lectura (Read-Only). Retorna un reporte de auditoría.
 * - Valida la unicidad de identificadores (IDs).
 * - Verifica la preservación de la cadena de custodia (data-ld-*).
 * - Castiga el uso de ARIA redundante (ej. <article role="article">).
 * - No modifica, repara ni altera la cadena XHTML de entrada.
 */

'use strict';

// El validador de accesibilidad aún no está implementado (Fase RED esperada)
const AccessibilityValidator = require('../../../src/validadores/E22/AccessibilityValidator');

describe('E22.4.1 — Accessibility & Semantic Validator Contract (Fase RED)', () => {

    const validXHTMLSnippet = `
        <article id="ART_1" data-ld-e18="hash1" data-ld-rule="RULE">
            <section id="PAR_1" data-ld-e20-7="hash2">
                <p>Texto válido.</p>
            </section>
        </article>
    `;

    const redundantARIAXHTML = `
        <article id="ART_2" role="article" data-ld-e18="hash3">
            <p>Texto con ARIA redundante.</p>
        </article>
    `;

    const missingProvenanceXHTML = `
        <article id="ART_3">
            <p>Falta data-ld-e18.</p>
        </article>
    `;

    const duplicateIDsXHTML = `
        <article id="ART_1" data-ld-e18="hashA">...</article>
        <article id="ART_1" data-ld-e18="hashB">...</article>
    `;

    test('1. Invariante Read-Only: El validador retorna un reporte (PASS) y no altera el input', () => {
        const report = AccessibilityValidator.audit(validXHTMLSnippet);
        
        expect(report.status).toBe('PASS');
        expect(report.errors.length).toBe(0);
        expect(report.warnings.length).toBe(0);
    });

    test('2. Semántica Nativa: Castiga el uso de ARIA redundante (role="article" en <article>)', () => {
        const report = AccessibilityValidator.audit(redundantARIAXHTML);
        
        // Un ARIA redundante no rompe el renderizado, pero debe emitir un WARNING semántico
        expect(report.status).not.toBe('PASS'); 
        expect(report.warnings).toContainEqual(
            expect.objectContaining({ code: 'REDUNDANT_ARIA_ROLE' })
        );
    });

    test('3. Provenance Contract: Detecta la ausencia de trazabilidad (data-ld-*) en nodos raíz', () => {
        const report = AccessibilityValidator.audit(missingProvenanceXHTML);
        
        expect(report.status).toBe('FAIL');
        expect(report.errors).toContainEqual(
            expect.objectContaining({ code: 'MISSING_PROVENANCE_ROOT' })
        );
    });

    test('4. Integridad Estructural: Detecta colisión de identificadores (IDs duplicados)', () => {
        const report = AccessibilityValidator.audit(duplicateIDsXHTML);
        
        expect(report.status).toBe('FAIL');
        expect(report.errors).toContainEqual(
            expect.objectContaining({ code: 'DUPLICATE_ID' })
        );
    });

    test('5. Falla controlada si el input es nulo o no es una cadena de texto', () => {
        expect(() => {
            AccessibilityValidator.audit(null);
        }).toThrow(/VALIDATOR_INPUT_VIOLATION/);
    });

});