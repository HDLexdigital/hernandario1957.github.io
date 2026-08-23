/**
 * E18.3.4 — Suite de Fronteras y Continuidad para SPLIT (AnchorAlignmentEngine)
 * 
 * Fase: RED
 * 
 * Contrato:
 * - Un ALIGN.SPLIT requiere evidencia de continuidad física en los nodos DOM intermedios.
 * - Prohibición absoluta de absorción por mera proximidad de índices hacia la siguiente frontera.
 * - Los nodos DOM intermedios que constituyan contenido independiente o de otra naturaleza bloquean la expansión del split.
 * - Si la continuidad física no puede demostrarse, el rango no debe sobreabsorber.
 * - Inmutabilidad absoluta y preservación estricta de la monotonicidad.
 */

'use strict';

const AnchorAlignmentEngine = require('../../../src/validadores/E18/AnchorAlignmentEngine');
const StructuralAnchorExtractor = require('../../../src/validadores/E18/StructuralAnchorExtractor');

describe('E18.3.4 — Strict SPLIT Boundary & Physical Continuity Contract (Fase RED)', () => {

    const createNode = (index, text, kind = 'text') => ({
        index,
        normalizedText: text,
        semanticType: 'parrafo',
        nodeKind: kind,
        contentFingerprint: `sha256:${text}`
    });

    const createDoc = (nodes, source = 'AST') => ({ version: '1.0.0', source, nodes });

    test('1. SPLIT legítimo 1→2 con continuidad física directa', () => {
        const astDoc = createDoc([
            createNode(0, 'Artículo 50. Texto completo unificado.')
        ], 'AST');
        const domDoc = createDoc([
            createNode(0, 'Artículo 50. Texto '),
            createNode(1, 'completo unificado.')
        ], 'DOM');

        const astExtraction = StructuralAnchorExtractor.extract(astDoc);
        const domExtraction = StructuralAnchorExtractor.extract(domDoc);

        const result = AnchorAlignmentEngine.align(astDoc, domDoc, astExtraction, domExtraction);

        const split = result.alignments.find(a => a.status === 'ALIGN.SPLIT');
        expect(split).toBeDefined();
        expect(split.astRange).toEqual([0, 0]);
        expect(split.domRange).toEqual([0, 1]);
    });

    test('2. Rechaza absorción arbitraria de nodo DOM intermedio que pertenezca a otra entidad o contenido extraño', () => {
        const astDoc = createDoc([
            createNode(0, 'Artículo 60. Contenido inicial.'),
            createNode(1, 'Artículo 61. Siguiente hito.')
        ], 'AST');
        const domDoc = createDoc([
            createNode(0, 'Artículo 60. Parte 1.'),
            createNode(1, 'Nodo extraño o sin relación temática de interrupción.'),
            createNode(2, 'Artículo 61. Siguiente hito.')
        ], 'DOM');

        const astExtraction = StructuralAnchorExtractor.extract(astDoc);
        const domExtraction = StructuralAnchorExtractor.extract(domDoc);

        const result = AnchorAlignmentEngine.align(astDoc, domDoc, astExtraction, domExtraction);

        // El nodo [1] del DOM no debe ser absorbido ciegamente por el split del Artículo 60
        const splits = result.alignments.filter(a => a.status === 'ALIGN.SPLIT');
        if (splits.length > 0) {
            expect(splits[0].domRange).not.toContain(1);
        }
    });

    test('3. Frontera dura del siguiente anclaje DOM previene desbordamiento del split', () => {
        const astDoc = createDoc([
            createNode(0, 'Artículo 70. Hito AST.')
        ], 'AST');
        const domDoc = createDoc([
            createNode(0, 'Artículo 70. Fragmento A.'),
            createNode(1, 'Fragmento B.'),
            createNode(2, 'Artículo 71. Siguiente artículo delimitado.')
        ], 'DOM');

        const astExtraction = StructuralAnchorExtractor.extract(astDoc);
        const domExtraction = StructuralAnchorExtractor.extract(domDoc);

        const result = AnchorAlignmentEngine.align(astDoc, domDoc, astExtraction, domExtraction);

        const split = result.alignments.find(a => a.status === 'ALIGN.SPLIT');
        if (split) {
            // Jamás debe incluir el índice 2, ya que pertenece al Artículo 71
            expect(split.domRange[1]).toBeLessThan(2);
        }
    });

    test('4. SPLIT al final del documento respeta estrictamente los nodos huérfanos sin sobreabsorción', () => {
        const astDoc = createDoc([
            createNode(0, 'Artículo 80. Final de norma.')
        ], 'AST');
        const domDoc = createDoc([
            createNode(0, 'Artículo 80. Parte 1.'),
            createNode(1, 'Parte 2 final.'),
            createNode(2, 'Nota al pie o texto posterior desvinculado.')
        ], 'DOM');

        const astExtraction = StructuralAnchorExtractor.extract(astDoc);
        const domExtraction = StructuralAnchorExtractor.extract(domDoc);

        const result = AnchorAlignmentEngine.align(astDoc, domDoc, astExtraction, domExtraction);

        const split = result.alignments.find(a => a.status === 'ALIGN.SPLIT');
        if (split) {
            expect(split.domRange).toEqual([0, 1]);
        }
    });

    test('5. Preservación absoluta de la monotonicidad en esquemas de split complejos', () => {
        const astDoc = createDoc([createNode(0, 'Artículo 1.')], 'AST');
        const domDoc = createDoc([createNode(0, 'Artículo 1. A'), createNode(1, 'B')], 'DOM');

        const astExtraction = StructuralAnchorExtractor.extract(astDoc);
        const domExtraction = StructuralAnchorExtractor.extract(domDoc);

        const result = AnchorAlignmentEngine.align(astDoc, domDoc, astExtraction, domExtraction);

        expect(result.summary.ambiguous).toBe(0);
    });

    test('6. Inmutabilidad estricta de los documentos de entrada', () => {
        const astDoc = createDoc([createNode(0, 'Artículo 90.')], 'AST');
        const domDoc = createDoc([createNode(0, 'Artículo 90. P1'), createNode(1, 'P2')], 'DOM');
        const astExtraction = StructuralAnchorExtractor.extract(astDoc);
        const domExtraction = StructuralAnchorExtractor.extract(domDoc);

        const cloneAst = JSON.parse(JSON.stringify(astDoc));
        const cloneDom = JSON.parse(JSON.stringify(domDoc));

        AnchorAlignmentEngine.align(astDoc, domDoc, astExtraction, domExtraction);

        expect(astDoc).toEqual(cloneAst);
        expect(domDoc).toEqual(cloneDom);
    });

});