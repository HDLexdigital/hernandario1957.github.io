/**
 * E20.6.1 — Cross-Boundary Evidence Contract Suite
 * 
 * Fase: RED
 * 
 * Contrato de Observación de Fronteras:
 * - Detecta y describe nodos en el AST completo que quedan fuera de los rangos certificados por E20.5.
 * - Prohíbe inferir relaciones semánticas basadas en saltos de línea, indentación o mera proximidad.
 * - No corrige ni muta el baseline de E20.5 (ATOMIC_BLOCK permanece inmutable).
 * - UNKNOWN significa incapacidad para determinar una estructura adicional en la frontera, no ausencia de ella.
 * - Garantiza trazabilidad completa desde el nodo AST hasta la afirmación E20.6.
 */

'use strict';

// El motor de fronteras aún no está implementado (Fase RED esperada)
const CrossBoundaryEngine = require('../../../src/validadores/E20/CrossBoundaryEngine');

describe('E20.6.1 — Cross-Boundary Evidence Contract (Fase RED)', () => {

    const mockE20_5_Dossier = Object.freeze({
        alignmentId: 1,
        composition: { type: 'ATOMIC_BLOCK', subComponents: [] },
        traceability: {
            baseDossierRef: {
                traceability: { e18EvidenceRef: { astRange: [10, 10] } } // Rango observado por E20.5
            }
        }
    });

    const mockFullAST = Object.freeze([
        // ... (nodos 0 al 9 omitidos por brevedad)
        ...Array(10).fill({ normalizedText: '...' }),
        { normalizedText: 'Artículo 1. Texto principal.', index: 10 }, // Dentro de E20.5
        { normalizedText: 'Parágrafo. El texto adicional.', index: 11 }, // Fuera de E20.5
        { normalizedText: 'Texto sin marcador explícito.', index: 12 }   // Fuera de E20.5
    ]);

    test('1. Observación de frontera: Detecta nodos fuera del rango E20.5 sin inventar relaciones forzadas', () => {
        const payload = {
            baseStructuralDossier: mockE20_5_Dossier,
            fullAST: mockFullAST,
            evaluationVersion: '1.0.0'
        };

        const boundaryReport = CrossBoundaryEngine.observeBoundary(payload);

        expect(boundaryReport).toBeDefined();
        // Debe detectar que existe evidencia adyacente fuera del rango [10, 10]
        expect(boundaryReport.boundaryObservation.hasAdjacentNodes).toBe(true);
        expect(boundaryReport.boundaryObservation.observedOutsideRange).toEqual([11, 12]);
        // Pero no debe pre-clasificarla sin evidencia léxica validada
        expect(boundaryReport.boundaryObservation.structuralStatus).not.toBe('ASSUMED_CHILD');
    });

    test('2. Forbidden Claims: Prohíbe convertir proximidad espacial o visual en relación semántica', () => {
        const payload = {
            baseStructuralDossier: mockE20_5_Dossier,
            fullAST: mockFullAST, // El nodo 12 es adyacente pero no tiene marcador
            evaluationVersion: '1.0.0'
        };

        const boundaryReport = CrossBoundaryEngine.observeBoundary(payload);
        const node12Analysis = boundaryReport.boundaryObservation.nodesAnalysis.find(n => n.astIndex === 12);

        // La mera proximidad no otorga estatus estructural
        expect(node12Analysis.structuralLink).toBe('REJECTED_PROXIMITY_INFERENCE');
    });

    test('3. UNKNOWN: Evidencia insuficiente en la frontera deriva en UNKNOWN', () => {
        const payload = {
            baseStructuralDossier: mockE20_5_Dossier,
            fullAST: mockFullAST,
            evaluationVersion: '1.0.0'
        };

        const boundaryReport = CrossBoundaryEngine.observeBoundary(payload);
        const node12Analysis = boundaryReport.boundaryObservation.nodesAnalysis.find(n => n.astIndex === 12);

        expect(node12Analysis.claim).toBe('UNKNOWN');
    });

    test('4. Inmutabilidad: Prohíbe reinterpretar ATOMIC_BLOCK retrospectivamente', () => {
        const payload = {
            baseStructuralDossier: mockE20_5_Dossier,
            fullAST: mockFullAST,
            evaluationVersion: '1.0.0'
        };

        const boundaryReport = CrossBoundaryEngine.observeBoundary(payload);

        // El dossier E20.5 original debe permanecer intacto dentro de la trazabilidad
        expect(boundaryReport.traceability.e20_5_Ref.composition.type).toBe('ATOMIC_BLOCK');
        expect(Object.isFrozen(boundaryReport)).toBe(true);
    });

    test('5. Trazabilidad completa desde el nodo AST cruzando las fronteras', () => {
        const payload = {
            baseStructuralDossier: mockE20_5_Dossier,
            fullAST: mockFullAST,
            evaluationVersion: '1.0.0'
        };

        const boundaryReport = CrossBoundaryEngine.observeBoundary(payload);
        const node11Analysis = boundaryReport.boundaryObservation.nodesAnalysis.find(n => n.astIndex === 11);

        // Debe reconstruir la cadena: Nodo -> Identidad de frontera -> E20.5
        expect(node11Analysis.traceability.astIndex).toBe(11);
        expect(node11Analysis.traceability.boundaryIdentity).toBe('POST_RANGE_ADJACENT');
        expect(node11Analysis.traceability.baseRange).toEqual([10, 10]);
    });

});