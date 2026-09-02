/**
 * E20.3.3 — Domain Gap Analysis Contract Suite
 * 
 * Fase: RED
 * 
 * Contrato de Análisis de Brechas:
 * - Analiza la diversidad taxonómica y la concentración de categorías (CCR) sobre el baseline E20.2.4.
 * - Distingue explícitamente entre cobertura operacional (100%) y completitud semántica/taxonómica.
 * - Detecta riesgos de sobrerregulación o reglas demasiado amplias (over-generalization).
 * - Prohíbe modificar el baseline histórico o transformar hipótesis de brecha en afirmaciones normativas automáticas.
 * - Garantiza trazabilidad de extremo a extremo hacia los expedientes inferiores.
 */

'use strict';

// El analizador de brechas aún no está implementado (Fase RED esperada)
const DomainGapAnalyzer = require('../../../src/validadores/E20/DomainGapAnalyzer');

describe('E20.3.3 — Domain Gap Analysis Contract (Fase RED)', () => {

    const mockHomogeneousBaseline = Object.freeze([
        Object.freeze({ alignmentId: 1, claim: { status: 'VALIDATED', semanticType: 'ARTICULO' } }),
        Object.freeze({ alignmentId: 2, claim: { status: 'VALIDATED', semanticType: 'ARTICULO' } }),
        Object.freeze({ alignmentId: 3, claim: { status: 'VALIDATED', semanticType: 'ARTICULO' } })
    ]);

    const mockDiverseBaseline = Object.freeze([
        Object.freeze({ alignmentId: 1, claim: { status: 'VALIDATED', semanticType: 'ARTICULO' } }),
        Object.freeze({ alignmentId: 2, claim: { status: 'VALIDATED', semanticType: 'PARRAFO' } }),
        Object.freeze({ alignmentId: 3, claim: { status: 'VALIDATED', semanticType: 'NUMERAL' } })
    ]);

    test('1. Input Evidence: Requiere baseline inmutable y calcula distribución taxonómica', () => {
        const analysis = DomainGapAnalyzer.analyze({ baselineDossiers: mockHomogeneousBaseline });

        expect(analysis).toBeDefined();
        expect(analysis.distribution).toBeDefined();
        expect(analysis.distribution.ARTICULO).toBe(3);
        // Verificar inmutabilidad profunda del baseline recibido
        expect(() => { mockHomogeneousBaseline.push({}); }).toThrow();
    });

    test('2. Category Concentration Ratio (CCR): Detecta alta concentración taxonómica frente a diversidad', () => {
        const homAnalysis = DomainGapAnalyzer.analyze({ baselineDossiers: mockHomogeneousBaseline });
        const divAnalysis = DomainGapAnalyzer.analyze({ baselineDossiers: mockDiverseBaseline });

        // Alta concentración (CCR = 1.0 cuando el 100% pertenece a una sola categoría)
        expect(homAnalysis.taxonomicMetrics.categoryConcentrationRatio).toBe(1.0);
        // Menor concentración ante mayor diversidad taxonómica
        expect(divAnalysis.taxonomicMetrics.categoryConcentrationRatio).toBeLessThan(1.0);
    });

    test('3. Over-generalization Risk: Señala sospecha de regla demasiado amplia ante alta concentración estructural', () => {
        const analysis = DomainGapAnalyzer.analyze({ baselineDossiers: mockHomogeneousBaseline });

        expect(analysis.gapFindings.overGeneralizationRisk).toBe(true);
    });

    test('4. Forbidden Claims: Prohíbe modificar el baseline o reinterpretar datos históricos', () => {
        const analysis = DomainGapAnalyzer.analyze({ baselineDossiers: mockHomogeneousBaseline });

        expect(analysis.forbiddenViolationsDetected).toBe(false);
        expect(analysis.baselineModified).toBe(false);
    });

    test('5. Traceability: Cada hallazgo de brecha se remonta al baseline y origen', () => {
        const analysis = DomainGapAnalyzer.analyze({ baselineDossiers: mockHomogeneousBaseline });

        expect(analysis.traceability).toBeDefined();
        expect(analysis.traceability.baselineVersion).toBe('E20.2.4');
    });

});