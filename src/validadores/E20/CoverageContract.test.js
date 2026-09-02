/**
 * E20.3.1 — Semantic Coverage Contract Suite
 * 
 * Fase: RED
 * 
 * Contrato de Cobertura:
 * - Valida qué insumos certificados de E20.2.4 consume la métrica de cobertura.
 * - Autoriza exclusivamente afirmaciones de proporción y tipificación de entidades cubiertas frente a UNKNOWN.
 * - Prohíbe convertir un UNKNOWN en una estructura conocida o falsear la ausencia de reglas como ausencia de derecho.
 * - Garantiza la trazabilidad absoluta de cada métrica de cobertura hasta el DOM original.
 */

'use strict';

// El motor de cobertura aún no está implementado (Fase RED esperada)
const CoverageEngine = require('../../../src/validadores/E20/CoverageEngine');

describe('E20.3.1 — Semantic Coverage Contract (Fase RED)', () => {

    const mockE20DossiersBaseline = Object.freeze([
        Object.freeze({
            alignmentId: 1,
            claim: { status: 'VALIDATED', semanticType: 'ARTICULO' },
            traceability: { e18EvidenceRef: { status: 'ALIGN.MATCH' }, e19EvidenceRef: { classification: { type: 'EXACT_MATCH' } } }
        }),
        Object.freeze({
            alignmentId: 2,
            claim: { status: 'UNKNOWN', semanticType: 'UNKNOWN' },
            traceability: { e18EvidenceRef: { status: 'ALIGN.SPLIT' }, e19EvidenceRef: { classification: { type: 'GENUINE_CONTENT_ADDITION' } } }
        })
    ]);

    test('1. Input Evidence: Requiere un baseline de dossiers E20.2.4 válido e inmutable', () => {
        const payload = {
            dossiers: mockE20DossiersBaseline,
            evaluationVersion: '1.0.0'
        };

        const report = CoverageEngine.evaluateCoverage(payload);

        expect(report).toBeDefined();
        // Verificar inmutabilidad profunda de la entrada
        expect(() => { payload.dossiers.push({}); }).toThrow();
    });

    test('2. Authorized Claims: Produce métricas de cobertura basadas estrictamente en entidades conocidas vs UNKNOWN', () => {
        const payload = {
            dossiers: mockE20DossiersBaseline,
            evaluationVersion: '1.0.0'
        };

        const report = CoverageEngine.evaluateCoverage(payload);

        expect(report.metrics.totalEvaluated).toBe(2);
        expect(report.metrics.coveredCount).toBe(1);
        expect(report.metrics.unknownCount).toBe(1);
        expect(report.metrics.coverageRatio).toBe(0.5);
    });

    test('3. Forbidden Claims: Prohíbe transformar UNKNOWN en estructuras conocidas o inventar equivalencias', () => {
        const payload = {
            dossiers: mockE20DossiersBaseline,
            evaluationVersion: '1.0.0'
        };

        const report = CoverageEngine.evaluateCoverage(payload);

        // El reporte nunca debe asumir que un UNKNOWN es un artículo implícito
        expect(report.forbiddenViolationsDetected).toBe(false);
        expect(report.metrics.inferredEntities).toBeUndefined();
    });

    test('4. Uncertainty (UNKNOWN): Distingue explícitamente las causas de no cobertura (ausencia de regla vs ambigüedad)', () => {
        const payload = {
            dossiers: mockE20DossiersBaseline,
            evaluationVersion: '1.0.0'
        };

        const report = CoverageEngine.evaluateCoverage(payload);

        expect(report.uncertaintyBreakdown).toBeDefined();
        expect(report.uncertaintyBreakdown.unrecognizedStructure).toBeDefined();
    });

    test('5. Traceability: Cada métrica de cobertura conserva la cadena de custodia hacia los expedientes inferiores', () => {
        const payload = {
            dossiers: mockE20DossiersBaseline,
            evaluationVersion: '1.0.0'
        };

        const report = CoverageEngine.evaluateCoverage(payload);

        expect(report.traceabilityChainRef).toBeDefined();
        expect(report.traceabilityChainRef.baselineVersion).toBe('E20.2.4');
    });

});