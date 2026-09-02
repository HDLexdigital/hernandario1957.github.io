/**
 * E20.2.1 — Semantic Evidence Adapter Contract Suite
 * 
 * Fase: RED
 * 
 * Contrato del Adaptador:
 * - Toma expedientes certificados de E18 (topología) y E19 (integridad física).
 * - Construye un Semantic Evidence Dossier unificado preservando la cadena de custodia.
 * - Aplica inmutabilidad profunda sobre el paquete de ejecución resultante.
 * - Garantiza que no se generen afirmaciones causales o normativas no autorizadas.
 */

'use strict';

// El adaptador de evidencia semántica aún no está implementado (Fase RED esperada)
const SemanticEvidenceAdapter = require('../../../src/validadores/E20/SemanticEvidenceAdapter');

describe('E20.2.1 — Semantic Evidence Adapter Contract (Fase RED)', () => {

    const mockE18RealDossier = Object.freeze({
        astRange: [0, 1],
        domRange: [0, 2],
        status: 'ALIGN.SPLIT',
        topologyEvidence: { clean: true }
    });

    const mockE19RealDossier = Object.freeze({
        classification: { type: 'GENUINE_CONTENT_ADDITION', confidence: 'HIGH' },
        editorialEquivalence: 'NOT_DEMONSTRATED'
    });

    test('1. Adaptación y unificación correcta de expedientes E18 y E19', () => {
        const adapterInput = {
            e18: mockE18RealDossier,
            e19: mockE19RealDossier,
            nodeText: 'Artículo 13. Todas las personas nacen libres...',
            contextId: 'CORPUS_FRAGMENT_01'
        };

        const executionDossier = SemanticEvidenceAdapter.adapt(adapterInput);

        expect(executionDossier).toBeDefined();
        expect(executionDossier.traceability.e18EvidenceRef).toEqual(mockE18RealDossier);
        expect(executionDossier.traceability.e19EvidenceRef).toEqual(mockE19RealDossier);
        expect(executionDossier.contextId).toBe('CORPUS_FRAGMENT_01');
    });

    test('2. Inmutabilidad profunda del dossier de ejecución adaptado', () => {
        const executionDossier = SemanticEvidenceAdapter.adapt({
            e18: mockE18RealDossier,
            e19: mockE19RealDossier,
            nodeText: 'Artículo 13.'
        });

        expect(Object.isFrozen(executionDossier)).toBe(true);
        expect(() => { executionDossier.contextId = 'MUTATED'; }).toThrow();
    });

    test('3. Rechazo estricto de entradas con expedientes incompletos o nulos', () => {
        expect(() => {
            SemanticEvidenceAdapter.adapt({ e18: null, e19: mockE19RealDossier });
        }).toThrow();

        expect(() => {
            SemanticEvidenceAdapter.adapt({ e18: mockE18RealDossier, e19: null });
        }).toThrow();
    });

    test('4. Prohibición de inferencias normativas automáticas en la adaptación', () => {
        const executionDossier = SemanticEvidenceAdapter.adapt({
            e18: mockE18RealDossier,
            e19: mockE19RealDossier,
            nodeText: 'Artículo 13.'
        });

        // El adaptador unifica evidencia, pero jamás debe fabricar cambios normativos
        expect(executionDossier.claim.normativeChange).toBeUndefined();
    });

});