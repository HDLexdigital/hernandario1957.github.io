/**
 * E20.1.1 — Semantic Evidence Contract Suite
 * 
 * Fase: RED
 * 
 * Contrato Epistemológico:
 * - Valida la trazabilidad estricta entre E18 (topología), E19 (evidencia física) y E20 (semántica).
 * - Prohíbe de forma absoluta producir afirmaciones semánticas sin cadena de evidencia válida.
 * - Garantiza que el estado UNKNOWN y NOT_APPLICABLE sean resultados de primera clase.
 * - Aplica inmutabilidad profunda sobre los expedientes de entrada E18 y E19.
 */

'use strict';

// El motor semántico aún no está implementado (Fase RED esperada)
const SemanticEngine = require('../../../src/validadores/E20/SemanticEngine');

describe('E20.1.1 — Semantic Evidence Contract (Fase RED)', () => {

    const mockE18Dossier = Object.freeze({
        astRange: [0, 2],
        domRange: [0, 3],
        status: 'ALIGN.MATCH',
        topologyEvidence: { clean: true }
    });

    const mockE19Dossier = Object.freeze({
        classification: { type: 'EXACT_MATCH', confidence: 'HIGH' },
        editorialEquivalence: 'NOT_DEMONSTRATED'
    });

    test('1. Input Evidence: Requiere expedientes E18 y E19 válidos e inmutables', () => {
        const payload = {
            e18: mockE18Dossier,
            e19: mockE19Dossier,
            semanticRuleId: 'RULE_ARTICLE_DETECT',
            semanticRuleVersion: '1.0.0'
        };

        const dossier = SemanticEngine.evaluate(payload);

        expect(dossier).toBeDefined();
        // Verificar inmutabilidad profunda de las entradas
        expect(() => { payload.e18.astRange.push(99); }).toThrow();
    });

    test('2. Authorized Claims: Toda afirmación semántica requiere referencias de evidencia válidas', () => {
        const payload = {
            e18: mockE18Dossier,
            e19: mockE19Dossier,
            semanticRuleId: 'RULE_ARTICLE_DETECT',
            semanticRuleVersion: '1.0.0'
        };

        const dossier = SemanticEngine.evaluate(payload);

        expect(dossier.claim).toBeDefined();
        expect(dossier.traceability.e18EvidenceRef).toBeDefined();
        expect(dossier.traceability.e19EvidenceRef).toBeDefined();
    });

    test('3. Forbidden Claims: Rechaza cualquier afirmación sin cadena de evidencia', () => {
        const payloadWithoutEvidence = {
            e18: null,
            e19: null,
            semanticRuleId: 'RULE_ARTICLE_DETECT',
            semanticRuleVersion: '1.0.0'
        };

        // El contrato debe rechazar expedientes huérfanos sin evidencia fundacional
        expect(() => {
            SemanticEngine.evaluate(payloadWithoutEvidence);
        }).toThrow();
    });

    test('4. UNKNOWN / Uncertainty: Evidencia insuficiente o ambigua deriva en UNKNOWN', () => {
        const ambiguousE19 = Object.freeze({
            classification: { type: 'UNKNOWN', confidence: 'LOW' },
            editorialEquivalence: 'NOT_DEMONSTRATED'
        });

        const payload = {
            e18: mockE18Dossier,
            e19: ambiguousE19,
            semanticRuleId: 'RULE_ARTICLE_DETECT',
            semanticRuleVersion: '1.0.0'
        };

        const dossier = SemanticEngine.evaluate(payload);

        expect(dossier.claim.status).toBe('UNKNOWN');
        expect(dossier.claim.confidence).toBe('LOW');
    });

    test('5. Traceability: La cadena de custodia de la afirmación es completa y auditable', () => {
        const payload = {
            e18: mockE18Dossier,
            e19: mockE19Dossier,
            semanticRuleId: 'RULE_STRUCTURAL_UNIT',
            semanticRuleVersion: '1.0.0'
        };

        const dossier = SemanticEngine.evaluate(payload);

        expect(dossier.traceability).toEqual(
            expect.objectContaining({
                sourceRanges: expect.any(Object),
                e18EvidenceRef: expect.any(Object),
                e19EvidenceRef: expect.any(Object),
                semanticRuleId: 'RULE_STRUCTURAL_UNIT',
                semanticRuleVersion: '1.0.0'
            })
        );
    });

});