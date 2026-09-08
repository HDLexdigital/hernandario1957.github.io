/**
 * E19.2 — Suite Contractual Sintética del TextEvidenceEngine
 * 
 * Fase: RED
 * 
 * Contrato:
 * - Extrae evidencia física objetiva entre cadenas AST y DOM sin clasificar ni corregir.
 * - Mide longitudes, diferencias, conteos de caracteres y huellas dactilares de manera independiente.
 * - Detecta variaciones de whitespace y compactación sin asumir artefactos editoriales.
 * - Inmutabilidad absoluta de los textos y entradas originales.
 */

'use strict';

// El motor de evidencia textual aún no está implementado (Fase RED esperada)
const TextEvidenceEngine = require('../../../src/validadores/E19/TextEvidenceEngine');

describe('E19.2 — TextEvidenceEngine Contract Suite (Fase RED)', () => {

    test('EVIDENCE-001: Texto exactamente idéntico (EXACT_TEXT)', () => {
        const astText = 'Artículo 1. La soberanía reside en el pueblo.';
        const domText = 'Artículo 1. La soberanía reside en el pueblo.';

        const evidence = TextEvidenceEngine.analyze(astText, domText);

        expect(evidence.exactMatch).toBe(true);
        expect(evidence.lengthDifference).toBe(0);
        expect(evidence.whitespaceDelta).toBe(0);
    });

    test('EVIDENCE-002: Colapso de espacios (WHITESPACE_COLLAPSE)', () => {
        const astText = 'Las relaciones exteriores';
        const domText = 'Lasrelacionesexteriores';

        const evidence = TextEvidenceEngine.analyze(astText, domText);

        expect(evidence.exactMatch).toBe(false);
        expect(evidence.astLength).toBe(astText.length);
        expect(evidence.domLength).toBe(domText.length);
        expect(evidence.compactedMatch).toBe(true);
        expect(evidence.whitespaceDelta).toBeLessThan(0);
    });

    test('EVIDENCE-003: Adición de espacios (WHITESPACE_ADDITION)', () => {
        const astText = 'Texto normativo';
        const domText = 'Texto    normativo';

        const evidence = TextEvidenceEngine.analyze(astText, domText);

        expect(evidence.exactMatch).toBe(false);
        expect(evidence.compactedMatch).toBe(true);
        expect(evidence.whitespaceDelta).toBeGreaterThan(0);
    });

    test('EVIDENCE-004: Sustitución de caracteres (CHARACTER_SUBSTITUTION)', () => {
        const astText = 'Artículo 10.';
        const domText = 'Articulo 10.'; // Falta tilde

        const evidence = TextEvidenceEngine.analyze(astText, domText);

        expect(evidence.exactMatch).toBe(false);
        expect(evidence.compactedMatch).toBe(false);
        expect(evidence.substitutionCount).toBeGreaterThan(0);
    });

    test('EVIDENCE-005: Adición de contenido (CONTENT_ADDITION)', () => {
        const astText = 'Artículo base.';
        const domText = 'Artículo base con texto adicional.';

        const evidence = TextEvidenceEngine.analyze(astText, domText);

        expect(evidence.exactMatch).toBe(false);
        expect(evidence.lengthDifference).toBeGreaterThan(0);
        expect(evidence.astLength).toBeLessThan(evidence.domLength);
    });

    test('EVIDENCE-006: Devolución / Eliminación de contenido (CONTENT_DELETION)', () => {
        const astText = 'Artículo completo con notas.';
        const domText = 'Artículo completo.';

        const evidence = TextEvidenceEngine.analyze(astText, domText);

        expect(evidence.exactMatch).toBe(false);
        expect(evidence.lengthDifference).toBeLessThan(0);
        expect(evidence.astLength).toBeGreaterThan(evidence.domLength);
    });

    test('EVIDENCE-007: AST vacío', () => {
        const astText = '';
        const domText = 'Contenido DOM presente.';

        const evidence = TextEvidenceEngine.analyze(astText, domText);

        expect(evidence.astLength).toBe(0);
        expect(evidence.domLength).toBe(domText.length);
    });

    test('EVIDENCE-008: DOM vacío', () => {
        const astText = 'Contenido AST presente.';
        const domText = '';

        const evidence = TextEvidenceEngine.analyze(astText, domText);

        expect(evidence.astLength).toBe(astText.length);
        expect(evidence.domLength).toBe(0);
    });

    test('EVIDENCE-009: Ambos vacíos', () => {
        const evidence = TextEvidenceEngine.analyze('', '');

        expect(evidence.exactMatch).toBe(true);
        expect(evidence.astLength).toBe(0);
        expect(evidence.domLength).toBe(0);
    });

    test('EVIDENCE-010: Caracteres especiales y símbolos', () => {
        const astText = 'Texto con §, ¶ y ©.';
        const domText = 'Texto con §, ¶ y ©.';

        const evidence = TextEvidenceEngine.analyze(astText, domText);
        expect(evidence.exactMatch).toBe(true);
    });

    test('EVIDENCE-011: Acentos y normalización Unicode (NFC vs NFD)', () => {
        const astText = 'Café'.normalize('NFC');
        const domText = 'Café'.normalize('NFD');

        const evidence = TextEvidenceEngine.analyze(astText, domText);
        expect(evidence.unicodeNormalizedMatch).toBe(true);
    });

    test('EVIDENCE-012: Textos extensos de alto volumen', () => {
        const astText = 'A'.repeat(5000);
        const domText = 'A'.repeat(4999) + 'B';

        const evidence = TextEvidenceEngine.analyze(astText, domText);
        expect(evidence.exactMatch).toBe(false);
        expect(evidence.lengthDifference).toBe(0);
    });

    test('EVIDENCE-013: Inmutabilidad estricta de las cadenas de entrada', () => {
        const astText = 'Original AST';
        const domText = 'Original DOM';

        const astClone = astText.slice();
        const domClone = domText.slice();

        TextEvidenceEngine.analyze(astText, domText);

        expect(astText).toEqual(astClone);
        expect(domText).toEqual(domClone);
    });

    test('EVIDENCE-014: Reproducibilidad de huellas dactilares (Fingerprints)', () => {
        const text = 'Texto para huella dactilar.';
        const ev1 = TextEvidenceEngine.analyze(text, text);
        const ev2 = TextEvidenceEngine.analyze(text, text);

        expect(ev1.astFingerprint).toEqual(ev2.astFingerprint);
        expect(ev1.domFingerprint).toEqual(ev2.domFingerprint);
    });

});