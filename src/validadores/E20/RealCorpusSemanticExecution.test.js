/**
 * E20.2.2 — Real Corpus Semantic Execution Contract Suite
 * 
 * Fase: RED
 * 
 * Contrato de Ejecución sobre Corpus Real:
 * - Evalúa la detección de entidades (ARTICULO, PARRAFO, NUMERAL, LITERAL) o UNKNOWN sobre fragmentos del corpus.
 * - Preserva inalterados los expedientes fundacionales de E18 (astRange, domRange, status) y E19 (classification).
 * - Aplica negaciones estrictas ante falsos positivos o textos sin evidencia estructural suficiente.
 * - Garantiza trazabilidad de extremo a extremo y congelamiento profundo de los dossiers de salida.
 */

'use strict';

// El motor o corredor de corpus real aún no está implementado (Fase RED esperada)
const SemanticEvidenceAdapter = require('../../../src/validadores/E20/SemanticEvidenceAdapter');

describe('E20.2.2 — Real Corpus Semantic Execution Contract (Fase RED)', () => {

    const certifiedE18 = Object.freeze({
        astRange: [5, 5],
        domRange: [12, 14],
        status: 'ALIGN.SPLIT',
        topologyEvidence: { clean: true }
    });

    const certifiedE19 = Object.freeze({
        classification: { type: 'GENUINE_CONTENT_ADDITION', confidence: 'HIGH' },
        editorialEquivalence: 'NOT_DEMONSTRATED'
    });

    test('1. Detección positiva de estructura jurídica sobre elemento válido del corpus', () => {
        const result = SemanticEvidenceAdapter.adapt({
            e18: certifiedE18,
            e19: certifiedE19,
            nodeText: 'Artículo 13. Todas las personas nacen libres e iguales...',
            contextId: 'CORPUS_BLOCK_13',
            ruleId: 'RULE_CORPUS_EVAL',
            ruleVersion: '1.0.0'
        });

        expect(result.claim.semanticType).toBe('ARTICULO');
        expect(result.claim.status).toBe('VALIDATED');
        expect(result.contextId).toBe('CORPUS_BLOCK_13');
    });

    test('2. Negativos reales y manejo de UNKNOWN ante textos sin patrón estructural suficiente', () => {
        const ambiguousE19 = Object.freeze({
            classification: { type: 'UNKNOWN', confidence: 'LOW' },
            editorialEquivalence: 'NOT_DEMONSTRATED'
        });

        const result = SemanticEvidenceAdapter.adapt({
            e18: certifiedE18,
            e19: ambiguousE19,
            nodeText: 'Texto aleatorio de preámbulo sin estructura jurídica clara.',
            contextId: 'CORPUS_BLOCK_UNKNOWN',
            ruleId: 'RULE_CORPUS_EVAL',
            ruleVersion: '1.0.0'
        });

        expect(result.claim.status).toBe('UNKNOWN');
        expect(result.claim.semanticType).toBe('UNKNOWN');
    });

    test('3. Preservación estricta de metadatos de evidencia E18 y E19 originales', () => {
        const result = SemanticEvidenceAdapter.adapt({
            e18: certifiedE18,
            e19: certifiedE19,
            nodeText: 'Parágrafo. El Estado protegerá...',
            contextId: 'CORPUS_BLOCK_PARA'
        });

        expect(result.traceability.e18EvidenceRef).toEqual(certifiedE18);
        expect(result.traceability.e19EvidenceRef).toEqual(certifiedE19);
        expect(result.traceability.sourceRanges.astRange).toEqual([5, 5]);
        expect(result.editorialEquivalence).toBe('NOT_DEMONSTRATED');
    });

    test('4. Inmutabilidad profunda inquebrantable sobre el dossier de ejecución real', () => {
        const result = SemanticEvidenceAdapter.adapt({
            e18: certifiedE18,
            e19: certifiedE19,
            nodeText: 'Artículo 1.'
        });

        expect(Object.isFrozen(result)).toBe(true);
        expect(() => { result.claim.status = 'MUTATED'; }).toThrow();
    });

});