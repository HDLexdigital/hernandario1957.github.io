/**
 * E19.4.1 — Suite Contractual Sintética de SplitAwareEvidence
 * 
 * Fase: RED
 * 
 * Contrato:
 * - Analiza la evidencia física cuando existe fragmentación estructural (ALIGN.SPLIT).
 * - Garantiza que fragmentCount > 1 jamás constituya por sí mismo una evidencia de CONTENT_ADDITION.
 * - Distingue variaciones de whitespace y fragmentación geométrica de divergencias reales de contenido.
 * - Deriva en UNKNOWN ante ambigüedades de fragmentación y preserva editorialEquivalence: 'NOT_DEMONSTRATED'.
 * - Inmutabilidad estricta de las entradas originales.
 */

'use strict';

// El adaptador consciente de splits aún no está implementado (Fase RED esperada)
const SplitAwareEvidence = require('../../../src/validadores/E19/SplitAwareEvidence');

describe('E19.4.1 — SplitAwareEvidence Contract Suite (Fase RED)', () => {

    test('1. SPLIT puro sin divergencia textual (1 nodo AST vs 2+ nodos DOM equivalentes)', () => {
        const astText = 'El artículo establece las directrices fundamentales.';
        const domFragments = ['El artículo establece', ' las directrices fundamentales.'];

        const evidence = SplitAwareEvidence.analyzeSplit('ALIGN.SPLIT', [0, 0], [0, 1], astText, domFragments);

        expect(evidence.structuralFragmentation).toBe(true);
        expect(evidence.fragmentCount).toBe(2);
        expect(evidence.compactedMatch).toBe(true);
        expect(evidence.trueContentDivergence).toBe(false);
        // La fragmentación geométrica no debe inferir adición de contenido
        expect(evidence.inferredType).not.toBe('CONTENT_ADDITION');
    });

    test('2. SPLIT con variación de whitespace tras colación', () => {
        const astText = 'Las relaciones diplomáticas y comerciales';
        const domFragments = ['Las relaciones', ' diplomáticas', ' y comerciales'];

        const evidence = SplitAwareEvidence.analyzeSplit('ALIGN.SPLIT', [0, 0], [0, 2], astText, domFragments);

        expect(evidence.structuralFragmentation).toBe(true);
        expect(evidence.fragmentCount).toBe(3);
        expect(evidence.compactedMatch).toBe(true);
        expect(evidence.trueContentDivergence).toBe(false);
    });

    test('3. SPLIT con contenido realmente añadido en el DOM fragmentado', () => {
        const astText = 'Principio general.';
        const domFragments = ['Principio general', ' con un parágrafo transitorio adicional.'];

        const evidence = SplitAwareEvidence.analyzeSplit('ALIGN.SPLIT', [0, 0], [0, 1], astText, domFragments);

        expect(evidence.structuralFragmentation).toBe(true);
        expect(evidence.trueContentDivergence).toBe(true);
        expect(evidence.inferredType).toBe('CONTENT_ADDITION');
    });

    test('4. SPLIT con contenido realmente eliminado o ausente en el DOM', () => {
        const astText = 'Texto original extenso y completo.';
        const domFragments = ['Texto original'];

        const evidence = SplitAwareEvidence.analyzeSplit('ALIGN.SPLIT', [0, 0], [0, 0], astText, domFragments);

        expect(evidence.structuralFragmentation).toBe(true);
        expect(evidence.trueContentDivergence).toBe(true);
        expect(evidence.inferredType).toBe('CONTENT_DELETION');
    });

    test('5. Fragmentación múltiple (fragmentCount > 2) no distorsiona la evaluación textual', () => {
        const astText = 'Norma constitucional sobre derechos fundamentales.';
        const domFragments = ['Norma', ' constitucional', ' sobre', ' derechos', ' fundamentales.'];

        const evidence = SplitAwareEvidence.analyzeSplit('ALIGN.SPLIT', [0, 0], [0, 4], astText, domFragments);

        expect(evidence.fragmentCount).toBe(5);
        expect(evidence.compactedMatch).toBe(true);
        expect(evidence.inferredType).not.toBe('CONTENT_ADDITION');
    });

    test('6. Caso ambiguo o contradictorio deriva obligatoriamente en UNKNOWN', () => {
        const astText = 'Estructura simple.';
        const domFragments = ['Texto totalmente dispar en fragmentos', ' sin relación obvia.'];

        const evidence = SplitAwareEvidence.analyzeSplit('ALIGN.SPLIT', [0, 0], [0, 1], astText, domFragments);

        expect(evidence.inferredType).toBe('UNKNOWN');
    });

    test('7. Inmutabilidad estricta de las entradas originales', () => {
        const astText = 'Texto AST original';
        const domFragments = ['Fragmento 1', 'Fragmento 2'];

        const astClone = astText.slice();
        const domClone = JSON.parse(JSON.stringify(domFragments));

        SplitAwareEvidence.analyzeSplit('ALIGN.SPLIT', [0, 0], [0, 1], astText, domFragments);

        expect(astText).toEqual(astClone);
        expect(domFragments).toEqual(domClone);
    });

    test('8. Seguridad editorial: editorialEquivalence permanece en NOT_DEMONSTRATED', () => {
        const astText = 'Texto';
        const domFragments = ['Texto'];

        const evidence = SplitAwareEvidence.analyzeSplit('ALIGN.SPLIT', [0, 0], [0, 0], astText, domFragments);

        expect(evidence.editorialEquivalence).toBe('NOT_DEMONSTRATED');
    });

});