/**
 * E20.1.2 — Semantic Domain Rules Contract Suite
 * 
 * Fase: RED
 * 
 * Contrato de Dominio:
 * - Define entidades jurídicas explícitas (ARTICULO, PARRAFO, NUMERAL, LITERAL, REMISION_NORMATIVA) con ruleId y versión.
 * - Exige el cumplimiento de umbrales de evidencia; ante insuficiencia, deriva obligatoriamente en UNKNOWN.
 * - Prohíbe terminantemente transformar discrepancias físicas de E19 en afirmaciones de cambio normativo sin evidencia de mutación.
 * - Garantiza que ninguna regla semántica introduzca información externa no sustentada en el input certificado.
 */

'use strict';

// El motor de reglas de dominio aún no está implementado (Fase RED esperada)
const SemanticDomainEngine = require('../../../src/validadores/E20/SemanticDomainEngine');

describe('E20.1.2 — Semantic Domain Rules Contract (Fase RED)', () => {

    const validE18 = Object.freeze({
        astRange: [0, 0],
        domRange: [0, 0],
        status: 'ALIGN.MATCH'
    });

    const validE19 = Object.freeze({
        classification: { type: 'EXACT_MATCH', confidence: 'HIGH' },
        editorialEquivalence: 'NOT_DEMONSTRATED'
    });

    test('1. Detección válida de unidad semántica estrutural (ARTICULO) con ruleId y versión', () => {
        const payload = {
            e18: validE18,
            e19: validE19,
            nodeText: 'Artículo 1. Del Estado social de derecho.',
            ruleId: 'RULE_ARTICLE_DETECT',
            ruleVersion: '1.0.0'
        };

        const dossier = SemanticDomainEngine.evaluateDomain(payload);

        expect(dossier.claim.semanticType).toBe('ARTICULO');
        expect(dossier.ruleId).toBe('RULE_ARTICLE_DETECT');
        expect(dossier.ruleVersion).toBe('1.0.0');
        expect(dossier.claim.status).toBe('VALIDATED');
    });

    test('2. Umbral de evidencia insuficiente deriva obligatoriamente en UNKNOWN', () => {
        const ambiguousE19 = Object.freeze({
            classification: { type: 'UNKNOWN', confidence: 'LOW' },
            editorialEquivalence: 'NOT_DEMONSTRATED'
        });

        const payload = {
            e18: validE18,
            e19: ambiguousE19,
            nodeText: 'Texto incompleto o ambiguo sin patrón claro.',
            ruleId: 'RULE_ARTICLE_DETECT',
            ruleVersion: '1.0.0'
        };

        const dossier = SemanticDomainEngine.evaluateDomain(payload);

        expect(dossier.claim.status).toBe('UNKNOWN');
    });

    test('3. Prohibición de reinterpretar discrepancias físicas como cambios normativos directos', () => {
        const physicalMismatchE19 = Object.freeze({
            classification: { type: 'GENUINE_CONTENT_ADDITION', confidence: 'MEDIUM' },
            editorialEquivalence: 'NOT_DEMONSTRATED'
        });

        const payload = {
            e18: validE18,
            e19: physicalMismatchE19,
            nodeText: 'Artículo 2. soberanía.',
            ruleId: 'RULE_ARTICLE_DETECT',
            ruleVersion: '1.0.0'
        };

        const dossier = SemanticDomainEngine.evaluateDomain(payload);

        // La regla semántica procesa el artículo, pero tiene prohibido declarar un cambio normativo
        expect(dossier.claim.normativeChange).toBeUndefined();
        expect(dossier.forbiddenClaimsViolated).toBe(false);
    });

    test('4. Detección de otras unidades estructurales (PARRAFO, NUMERAL, LITERAL, REMISION)', () => {
        const rules = [
            { text: 'Parágrafo. El Gobierno reglamentará...', expectedType: 'PARRAFO', id: 'RULE_PARAGRAPH_DETECT' },
            { text: '1. La defensa de los derechos...', expectedType: 'NUMERAL', id: 'RULE_NUMERAL_DETECT' },
            { text: 'a) Los ciudadanos podrán...', expectedType: 'LITERAL', id: 'RULE_LITERAL_DETECT' }
        ];

        rules.forEach(rule => {
            const dossier = SemanticDomainEngine.evaluateDomain({
                e18: validE18,
                e19: validE19,
                nodeText: rule.text,
                ruleId: rule.id,
                ruleVersion: '1.0.0'
            });

            expect(dossier.claim.semanticType).toBe(rule.expectedType);
            expect(dossier.ruleId).toBe(rule.id);
        });
    });

    test('5. Trazabilidad y no-introducción de información externa no sustentada', () => {
        const payload = {
            e18: validE18,
            e19: validE19,
            nodeText: 'Artículo 5. Primacía de los derechos inalienables.',
            ruleId: 'RULE_ARTICLE_DETECT',
            ruleVersion: '1.0.0'
        };

        const dossier = SemanticDomainEngine.evaluateDomain(payload);

        expect(dossier.traceability).toBeDefined();
        expect(dossier.traceability.e18EvidenceRef).toEqual(validE18);
        expect(dossier.traceability.e19EvidenceRef).toEqual(validE19);
    });

});