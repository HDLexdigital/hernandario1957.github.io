/**
 * E18.2.5.5.4 — Suite Contractual Sintética para RangeTextCollator (15 Pruebas)
 * 
 * Fase: RED
 * 
 * Contrato:
 * - Colaciona (concatena) texto normalizado según el orden topológico exacto de los índices.
 * - Cero inserción automática de espacios, escapes o modificaciones editoriales.
 * - Genera un contentFingerprint reproducible derivado del texto colacionado completo.
 * - Inmutabilidad absoluta sobre los nodos y arreglos fuente.
 * - Validación defensiva ante rangos vacíos, fuera de límites o invertidos.
 * - Cero interpretación de equivalencia editorial (solo concatena evidencia).
 */

'use strict';

// El componente está bloqueado hasta que los tests fallen estructuralmente (Fase RED)
const RangeTextCollator = require('../../../src/validadores/E18/RangeTextCollator');

describe('E18.2.5.5.4 — RangeTextCollator (Contrato Sintético - Fase RED)', () => {

    const createNode = (index, text) => ({
        index,
        normalizedText: text,
        semanticType: 'parrafo',
        nodeKind: 'text'
    });

    const createDoc = (nodes) => ({ version: '1.0.0', source: 'AST', nodes });

    test('1. Colación N:1 (MERGE clásico de 2 nodos) preservando orden estricto', () => {
        const doc = createDoc([
            createNode(0, 'Artículo 1. Texto A.'),
            createNode(1, ' Artículo 2. Texto B.')
        ]);

        const result = RangeTextCollator.collate(doc, [0, 1]);

        expect(result.collatedText).toBe('Artículo 1. Texto A. Artículo 2. Texto B.');
        expect(result.nodeCount).toBe(2);
    });

    test('2. Colación N:1 de 3 nodos consecutivos', () => {
        const doc = createDoc([
            createNode(0, 'Parte1'),
            createNode(1, 'Parte2'),
            createNode(2, 'Parte3')
        ]);

        const result = RangeTextCollator.collate(doc, [0, 2]);

        expect(result.collatedText).toBe('Parte1Parte2Parte3');
    });

    test('3. Colación 1:N (SPLIT clásico) sobre sub-rango DOM', () => {
        const doc = createDoc([
            createNode(5, 'Fragmento uno. '),
            createNode(6, 'Fragmento dos.')
        ]);

        const result = RangeTextCollator.collate(doc, [5, 6]);

        expect(result.collatedText).toBe('Fragmento uno. Fragmento dos.');
    });

    test('4. Preservación estricta del orden topológico de los índices', () => {
        const doc = createDoc([
            createNode(10, 'Primero.'),
            createNode(11, 'Segundo.')
        ]);

        const result = RangeTextCollator.collate(doc, [10, 11]);

        expect(result.collatedText.indexOf('Primero.')).toBeLessThan(result.collatedText.indexOf('Segundo.'));
    });

    test('5. Preservación de espacios existentes sin normalización artificial', () => {
        const doc = createDoc([
            createNode(0, 'Texto con   espacios   múltiples.')
        ]);

        const result = RangeTextCollator.collate(doc, [0, 0]);

        expect(result.collatedText).toBe('Texto con   espacios   múltiples.');
    });

    test('6. Preservación estricta de caracteres especiales y escapes', () => {
        const doc = createDoc([
            createNode(0, 'Texto con "comillas" y \\backslash\\.')
        ]);

        const result = RangeTextCollator.collate(doc, [0, 0]);

        expect(result.collatedText).toBe('Texto con "comillas" y \\backslash\\.');
    });

    test('7. No elimina ni altera el contenido canonizado preexistente', () => {
        const doc = createDoc([
            createNode(2, '<div>HTML interno pre-canonizado</div>')
        ]);

        const result = RangeTextCollator.collate(doc, [2, 2]);

        expect(result.collatedText).toBe('<div>HTML interno pre-canonizado</div>');
    });

    test('8. Generación de contentFingerprint reproducible basado en el texto colacionado', () => {
        const doc1 = createDoc([createNode(0, 'Texto idéntico')]);
        const doc2 = createDoc([createNode(0, 'Texto idéntico')]);

        const r1 = RangeTextCollator.collate(doc1, [0, 0]);
        const r2 = RangeTextCollator.collate(doc2, [0, 0]);

        expect(r1.contentFingerprint).toBe(r2.contentFingerprint);
        expect(r1.contentFingerprint).toMatch(/^sha256:[a-f0-9]{64}$/);
    });

    test('9. contentFingerprint diferente ante textos colacionados distintos', () => {
        const docA = createDoc([createNode(0, 'Texto A')]);
        const docB = createDoc([createNode(0, 'Texto B')]);

        const rA = RangeTextCollator.collate(docA, [0, 0]);
        const rB = RangeTextCollator.collate(docB, [0, 0]);

        expect(rA.contentFingerprint).not.toBe(rB.contentFingerprint);
    });

    test('10. Inmutabilidad absoluta: el documento y nodos de entrada permanecen intactos', () => {
        const doc = createDoc([createNode(0, 'Inmutable')]);
        const clone = JSON.parse(JSON.stringify(doc));

        RangeTextCollator.collate(doc, [0, 0]);

        expect(doc).toEqual(clone);
    });

    test('11. Comportamiento contractual explícito ante rango vacío', () => {
        const doc = createDoc([createNode(0, 'Cualquiera')]);

        const result = RangeTextCollator.collate(doc, []);

        expect(result.collatedText).toBe('');
        expect(result.nodeCount).toBe(0);
    });

    test('12. Rechazo defensivo ante rangos fuera de los límites del documento', () => {
        const doc = createDoc([createNode(0, 'Solo uno')]);

        expect(() => {
            RangeTextCollator.collate(doc, [0, 5]);
        }).toThrow();
    });

    test('13. Rechazo defensivo ante rangos invertidos (ej. [1, 0])', () => {
        const doc = createDoc([createNode(0, 'A'), createNode(1, 'B')]);

        expect(() => {
            RangeTextCollator.collate(doc, [1, 0]);
        }).toThrow();
    });

    test('14. Comportamiento ante rango nulo o malformado', () => {
        const doc = createDoc([createNode(0, 'A')]);

        expect(() => {
            RangeTextCollator.collate(doc, null);
        }).toThrow();
    });

    test('15. Ausencia total de inferencia o juicio editorial (no decide equivalencia)', () => {
        const doc = createDoc([createNode(0, 'Contenido sin evaluar semántica')]);

        const result = RangeTextCollator.collate(doc, [0, 0]);

        // El resultado es estrictamente físico, sin etiquetas semánticas de veracidad
        expect(result).not.toHaveProperty('editorialEquivalence');
        expect(result).not.toHaveProperty('isCorrect');
    });

});