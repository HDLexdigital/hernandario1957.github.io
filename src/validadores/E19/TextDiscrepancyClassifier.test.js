/**
 * E19.3 — Suite Contractual Sintética del TextDiscrepancyClassifier
 * 
 * Fase: RED
 * 
 * Contrato:
 * - Tipifica la evidencia física provista por TextEvidenceEngine basándose estrictamente en la taxonomía canónica.
 * - editorialEquivalence permanece obligatoriamente en 'NOT_DEMONSTRATED' en todos los casos.
 * - Evidencia ambigua o contradictoria desemboca indefectiblemente en UNKNOWN.
 * - Preserva metadata estructural (mismatchIndex, astRange, domRange) e inmutabilidad del expediente.
 */

'use strict';

// El clasificador aún no está implementado (Fase RED esperada)
const TextDiscrepancyClassifier = require('../../../src/validadores/E19/TextDiscrepancyClassifier');
const TextEvidenceEngine = require('../../../src/validadores/E19/TextEvidenceEngine');
const TextDiscrepancyContract = require('../../../src/validadores/E19/TextDiscrepancyContract');

describe('E19.3 — TextDiscrepancyClassifier Contract Suite (Fase RED)', () => {

    const createMetadata = () => ({
        mismatchIndex: 5,
        astRange: [5, 5],
        domRange: [5, 5]
    });

    test('E19.3.001: Clasifica EXACT_MATCH correctamente y mantiene NOT_DEMONSTRATED', () => {
        const ast = 'Artículo 10.';
        const dom = 'Artículo 10.';
        const evidence = TextEvidenceEngine.analyze(ast, dom);
        const meta = createMetadata();

        const dossier = TextDiscrepancyClassifier.classify(meta.mismatchIndex, meta.astRange, meta.domRange, ast, dom, evidence);

        const validation = TextDiscrepancyContract.validateDossier(dossier);
        expect(validation.valid).toBe(true);
        expect(dossier.classification.type).toBe('EXACT_MATCH');
        expect(dossier.editorialEquivalence).toBe('NOT_DEMONSTRATED');
    });

    test('E19.3.002: Clasifica WHITESPACE_VARIATION cuando hay colapso o adición de espacios', () => {
        const ast = 'Las relaciones exteriores';
        const dom = 'Lasrelaciones exteriores';
        const evidence = TextEvidenceEngine.analyze(ast, dom);
        const meta = createMetadata();

        const dossier = TextDiscrepancyClassifier.classify(meta.mismatchIndex, meta.astRange, meta.domRange, ast, dom, evidence);

        expect(dossier.classification.type).toBe('WHITESPACE_VARIATION');
        expect(dossier.editorialEquivalence).toBe('NOT_DEMONSTRATED');
    });

    test('E19.3.003: Clasifica CHARACTER_SUBSTITUTION ante sustitución puntual de caracteres', () => {
        const ast = 'Artículo 10.';
        const dom = 'Articulo 10.';
        const evidence = TextEvidenceEngine.analyze(ast, dom);
        const meta = createMetadata();

        const dossier = TextDiscrepancyClassifier.classify(meta.mismatchIndex, meta.astRange, meta.domRange, ast, dom, evidence);

        expect(dossier.classification.type).toBe('CHARACTER_SUBSTITUTION');
        expect(dossier.editorialEquivalence).toBe('NOT_DEMONSTRATED');
    });

    test('E19.3.004: Clasifica CONTENT_ADDITION cuando DOM contiene contenido adicional neto', () => {
        const ast = 'Base.';
        const dom = 'Base con texto añadido.';
        const evidence = TextEvidenceEngine.analyze(ast, dom);
        const meta = createMetadata();

        const dossier = TextDiscrepancyClassifier.classify(meta.mismatchIndex, meta.astRange, meta.domRange, ast, dom, evidence);

        expect(dossier.classification.type).toBe('CONTENT_ADDITION');
        expect(dossier.editorialEquivalence).toBe('NOT_DEMONSTRATED');
    });

    test('E19.3.005: Clasifica CONTENT_DELETION cuando DOM presenta eliminación neta de texto', () => {
        const ast = 'Texto completo y largo.';
        const dom = 'Texto.';
        const evidence = TextEvidenceEngine.analyze(ast, dom);
        const meta = createMetadata();

        const dossier = TextDiscrepancyClassifier.classify(meta.mismatchIndex, meta.astRange, meta.domRange, ast, dom, evidence);

        expect(dossier.classification.type).toBe('CONTENT_DELETION');
        expect(dossier.editorialEquivalence).toBe('NOT_DEMONSTRATED');
    });

    test('E19.3.006: Clasifica TYPOGRAPHIC_NORMALIZATION ante variaciones de codificación Unicode (NFC vs NFD)', () => {
        const ast = 'Café'.normalize('NFC');
        const dom = 'Café'.normalize('NFD');
        const evidence = TextEvidenceEngine.analyze(ast, dom);
        const meta = createMetadata();

        const dossier = TextDiscrepancyClassifier.classify(meta.mismatchIndex, meta.astRange, meta.domRange, ast, dom, evidence);

        expect(dossier.classification.type).toBe('TYPOGRAPHIC_NORMALIZATION');
        expect(dossier.editorialEquivalence).toBe('NOT_DEMONSTRATED');
    });

    test('E19.3.007: Clasifica UNKNOWN por evidencia insuficiente o contradictoria', () => {
        const ast = 'Texto A';
        const dom = 'Texto B totalmente dispar y complejo';
        const evidence = TextEvidenceEngine.analyze(ast, dom);
        const meta = createMetadata();

        const dossier = TextDiscrepancyClassifier.classify(meta.mismatchIndex, meta.astRange, meta.domRange, ast, dom, evidence);

        expect(dossier.classification.type).toBe('UNKNOWN');
        expect(dossier.editorialEquivalence).toBe('NOT_DEMONSTRATED');
    });

    test('E19.3.010: Preservación exacta del mismatchIndex en el expediente generado', () => {
        const ast = 'A';
        const dom = 'B';
        const evidence = TextEvidenceEngine.analyze(ast, dom);
        const meta = createMetadata();

        const dossier = TextDiscrepancyClassifier.classify(meta.mismatchIndex, meta.astRange, meta.domRange, ast, dom, evidence);

        expect(dossier.mismatchIndex).toBe(meta.mismatchIndex);
    });

    test('E19.3.011: Preservación intacta de astRange y domRange', () => {
        const ast = 'A';
        const dom = 'B';
        const evidence = TextEvidenceEngine.analyze(ast, dom);
        const meta = createMetadata();

        const dossier = TextDiscrepancyClassifier.classify(meta.mismatchIndex, meta.astRange, meta.domRange, ast, dom, evidence);

        expect(dossier.astRange).toEqual(meta.astRange);
        expect(dossier.domRange).toEqual(meta.domRange);
    });

    test('E19.3.012: Inmutabilidad estricta del objeto de evidencia suministrado', () => {
        const ast = 'Texto';
        const dom = 'Texto modificado';
        const evidence = TextEvidenceEngine.analyze(ast, dom);
        const evidenceClone = JSON.parse(JSON.stringify(evidence));
        const meta = createMetadata();

        TextDiscrepancyClassifier.classify(meta.mismatchIndex, meta.astRange, meta.domRange, ast, dom, evidence);

        expect(evidence).toEqual(evidenceClone);
    });

});