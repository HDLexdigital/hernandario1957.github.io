/**
 * E20.6.2 — Cross-Boundary Evidence Adapter Contract Suite
 * 
 * Fase: RED
 * 
 * Contrato del Adaptador Transfronterizo:
 * - Itera masivamente los dossiers E20.5 (ATOMIC_BLOCK) y delega la observación al CrossBoundaryEngine.
 * - Consolida un reporte (CrossBoundaryAudit) de estructuras candidatas sin asignar propiedad (ownership: UNKNOWN).
 * - Rechaza la atribución semántica por proximidad.
 * - Protege los baselines históricos garantizando cero mutaciones.
 * - Audita invariantes: 0 orphan inputs, 0 baseline mutations, 0 provenance failures.
 */

'use strict';

// El adaptador de fronteras aún no está implementado (Fase RED esperada)
const CrossBoundaryAdapter = require('../../../src/validadores/E20/CrossBoundaryAdapter');

describe('E20.6.2 — Cross-Boundary Evidence Adapter Contract (Fase RED)', () => {

    const mockE20_5_Dossier = Object.freeze({
        alignmentId: 1,
        composition: { type: 'ATOMIC_BLOCK', subComponents: [] },
        traceability: {
            baseDossierRef: {
                traceability: { e18EvidenceRef: { astRange: [1, 1] } } // Rango E20.5
            }
        }
    });

    const mockFullAST = Object.freeze([
        { normalizedText: 'Texto previo...', index: 0 },
        { normalizedText: 'Artículo 1. Texto principal.', index: 1 }, // E20.5 Range
        { normalizedText: 'Parágrafo. Evidencia explícita.', index: 2 }, // CANDIDATE_STRUCTURE
        { normalizedText: 'Línea común sin marcadores.', index: 3 } // REJECTED_PROXIMITY_INFERENCE / UNKNOWN
    ]);

    test('1. Adaptación masiva: consolida hallazgos en un CrossBoundaryAudit inmutable', () => {
        const payload = {
            structuralDossiers: [mockE20_5_Dossier],
            fullAST: mockFullAST,
            evaluationVersion: '1.0.0'
        };

        const auditReport = CrossBoundaryAdapter.processBoundaries(payload);

        expect(auditReport).toBeDefined();
        expect(auditReport.summary.totalDossiers).toBe(1);
        expect(auditReport.summary.candidateStructures).toBeGreaterThanOrEqual(1); // Detectó el nodo 2
        expect(Object.isFrozen(auditReport)).toBe(true);
    });

    test('2. Epistemología de Atribución: Una estructura candidata debe tener ownership UNKNOWN', () => {
        const payload = {
            structuralDossiers: [mockE20_5_Dossier],
            fullAST: mockFullAST,
            evaluationVersion: '1.0.0'
        };

        const auditReport = CrossBoundaryAdapter.processBoundaries(payload);
        const observation = auditReport.observations[0];
        const candidateNode = observation.boundaryObservation.nodesAnalysis.find(n => n.astIndex === 2);

        expect(candidateNode.claim).toBe('CANDIDATE_STRUCTURE');
        expect(candidateNode.traceability.boundaryIdentity).toBe('POST_RANGE_ADJACENT');
        
        // Regla de oro: No se atribuye propiedad jurídica por mera adyacencia
        expect(candidateNode.ownership).toBe('UNKNOWN');
    });

    test('3. Rechazo de inferencia por proximidad es tabulado correctamente en el reporte global', () => {
        const payload = {
            structuralDossiers: [mockE20_5_Dossier],
            fullAST: mockFullAST,
            evaluationVersion: '1.0.0'
        };

        const auditReport = CrossBoundaryAdapter.processBoundaries(payload);
        const observation = auditReport.observations[0];
        const rejectedNode = observation.boundaryObservation.nodesAnalysis.find(n => n.astIndex === 3);

        expect(rejectedNode.structuralLink).toBe('REJECTED_PROXIMITY_INFERENCE');
        expect(rejectedNode.claim).toBe('UNKNOWN');
    });

    test('4. Invariantes de Seguridad: Manejo estricto de procedencia y mutaciones', () => {
        const payload = {
            structuralDossiers: [mockE20_5_Dossier],
            fullAST: mockFullAST,
            evaluationVersion: '1.0.0'
        };

        const auditReport = CrossBoundaryAdapter.processBoundaries(payload);

        expect(auditReport.invariantsCheck.orphanInputs).toBe(0);
        expect(auditReport.invariantsCheck.baselineMutations).toBe(0);
        expect(auditReport.invariantsCheck.provenanceFailures).toBe(0);
    });

    test('5. Input inválido o carente de trazabilidad lanza error contractual', () => {
        const invalidPayload = {
            structuralDossiers: [ { alignmentId: 2 } ], // Sin trazabilidad E18
            fullAST: mockFullAST
        };

        expect(() => {
            CrossBoundaryAdapter.processBoundaries(invalidPayload);
        }).toThrow(/PROVENANCE_CONTRACT_VIOLATION/);
    });

});