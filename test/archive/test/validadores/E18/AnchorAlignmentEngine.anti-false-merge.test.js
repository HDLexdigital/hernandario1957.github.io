/**
 * E18.3.3 — Suite Anti-Falsos-Merges por Prosa (AnchorAlignmentEngine)
 * 
 * Fase: RED
 * 
 * Contrato:
 * - Una mención en prosa a un artículo posterior (ej. "de conformidad con el artículo 5") 
 *   no constituye evidencia de MERGE.
 * - Un anclaje posterior presente como nodo DOM independiente bloquea el MERGE.
 * - ALIGN.MERGE solo se emite ante contención estructural real y unívoca dentro del nodo DOM.
 * - Inmutabilidad absoluta y preservación estricta de la monotonicidad.
 */

'use strict';

// El motor con validación estructural estricta de MERGE está bloqueado (Fase RED)
const AnchorAlignmentEngine = require('../../../src/validadores/E18/AnchorAlignmentEngine');
const StructuralAnchorExtractor = require('../../../src/validadores/E18/StructuralAnchorExtractor');

describe('E18.3.3 — Grounded MERGE & Anti-False-Merge Contract (Fase RED)', () => {

    const createNode = (index, text) => ({
        index,
        normalizedText: text,
        semanticType: 'parrafo',
        nodeKind: 'text',
        contentFingerprint: `sha256:${text}`
    });

    const createDoc = (nodes, source = 'AST') => ({ version: '1.0.0', source, nodes });

    test('1. Referencia incidental a un artículo en la prosa no debe provocar un ALIGN.MERGE', () => {
        const astDoc = createDoc([
            createNode(0, 'Artículo 1. Contenido principal.'),
            createNode(1, 'Artículo 2. Texto con referencia al artículo 5 en la prosa.')
        ], 'AST');
        const domDoc = createDoc([
            createNode(0, 'Artículo 1. Contenido principal.'),
            createNode(1, 'Artículo 2. Texto con referencia al artículo 5 en la prosa.')
        ], 'DOM');

        const astExtraction = StructuralAnchorExtractor.extract(astDoc);
        const domExtraction = StructuralAnchorExtractor.extract(domDoc);

        const result = AnchorAlignmentEngine.align(astDoc, domDoc, astExtraction, domExtraction);

        // No debe haber merges inducidos por la mención de "artículo 5" en la prosa
        const merges = result.alignments.filter(a => a.status === 'ALIGN.MERGE');
        expect(merges.length).toBe(0);
    });

    test('2. Un artículo posterior presente como nodo DOM independiente impide el MERGE', () => {
        const astDoc = createDoc([
            createNode(0, 'Artículo 1.'),
            createNode(1, 'Artículo 2.')
        ], 'AST');
        const domDoc = createDoc([
            createNode(0, 'Artículo 1. Texto de art 1.'),
            createNode(1, 'Artículo 2. Texto de art 2 independiente.')
        ], 'DOM');

        const astExtraction = StructuralAnchorExtractor.extract(astDoc);
        const domExtraction = StructuralAnchorExtractor.extract(domDoc);

        const result = AnchorAlignmentEngine.align(astDoc, domDoc, astExtraction, domExtraction);

        const merges = result.alignments.filter(a => a.status === 'ALIGN.MERGE');
        expect(merges.length).toBe(0);
    });

    test('3. MERGE válido únicamente cuando el nodo DOM contiene estructuralmente ambos hitos sin nodos independientes', () => {
        const astDoc = createDoc([
            createNode(0, 'Artículo 1.'),
            createNode(1, 'Artículo 2.')
        ], 'AST');
        const domDoc = createDoc([
            createNode(0, 'Artículo 1. Texto fusionado con Artículo 2 en un mismo bloque.')
        ], 'DOM');

        const astExtraction = StructuralAnchorExtractor.extract(astDoc);
        const domExtraction = StructuralAnchorExtractor.extract(domDoc);

        const result = AnchorAlignmentEngine.align(astDoc, domDoc, astExtraction, domExtraction);

        const mergeAlignment = result.alignments.find(a => a.status === 'ALIGN.MERGE');
        expect(mergeAlignment).toBeDefined();
        expect(mergeAlignment.astRange).toEqual([0, 1]);
    });

    test('4. Variaciones de capitalización en prosa no activan falsos merges', () => {
        const astDoc = createDoc([
            createNode(0, 'Artículo 10.'),
            createNode(1, 'Mención a ARTÍCULO 15 en el desarrollo del texto.')
        ], 'AST');
        const domDoc = createDoc([
            createNode(0, 'Artículo 10. Mención a ARTÍCULO 15 en el desarrollo del texto.')
        ], 'DOM');

        const astExtraction = StructuralAnchorExtractor.extract(astDoc);
        const domExtraction = StructuralAnchorExtractor.extract(domDoc);

        const result = AnchorAlignmentEngine.align(astDoc, domDoc, astExtraction, domExtraction);

        const merges = result.alignments.filter(a => a.status === 'ALIGN.MERGE');
        expect(merges.length).toBe(0);
    });

    test('5. Referencias con abreviatura (Art.) en la prosa no provocan merges', () => {
        const astDoc = createDoc([
            createNode(0, 'Artículo 20.'),
            createNode(1, 'Ver Art. 25 para más detalles.')
        ], 'AST');
        const domDoc = createDoc([
            createNode(0, 'Artículo 20. Ver Art. 25 para más detalles.')
        ], 'DOM');

        const astExtraction = StructuralAnchorExtractor.extract(astDoc);
        const domExtraction = StructuralAnchorExtractor.extract(domDoc);

        const result = AnchorAlignmentEngine.align(astDoc, domDoc, astExtraction, domExtraction);

        const merges = result.alignments.filter(a => a.status === 'ALIGN.MERGE');
        expect(merges.length).toBe(0);
    });

    test('6. SPLIT auténtico se mantiene operando correctamente sin interferir con la regla MERGE', () => {
        const astDoc = createDoc([createNode(0, 'Artículo 30 Completo.')], 'AST');
        const domDoc = createDoc([
            createNode(0, 'Artículo 30 Parte primera. '),
            createNode(1, 'Parte segunda.')
        ], 'DOM');

        const astExtraction = StructuralAnchorExtractor.extract(astDoc);
        const domExtraction = StructuralAnchorExtractor.extract(domDoc);

        const result = AnchorAlignmentEngine.align(astDoc, domDoc, astExtraction, domExtraction);

        const splitAlignment = result.alignments.find(a => a.status === 'ALIGN.SPLIT');
        expect(splitAlignment).toBeDefined();
        expect(splitAlignment.domRange).toEqual([0, 1]);
    });

    test('7. Anclaje posterior ausente en DOM no infiere un MERGE ciego', () => {
        const astDoc = createDoc([
            createNode(0, 'Artículo 40.'),
            createNode(1, 'Artículo 41.')
        ], 'AST');
        const domDoc = createDoc([
            createNode(0, 'Artículo 40.')
        ], 'DOM');

        const astExtraction = StructuralAnchorExtractor.extract(astDoc);
        const domExtraction = StructuralAnchorExtractor.extract(domDoc);

        const result = AnchorAlignmentEngine.align(astDoc, domDoc, astExtraction, domExtraction);

        const merges = result.alignments.filter(a => a.status === 'ALIGN.MERGE');
        expect(merges.length).toBe(0);
    });

    test('8. Preservación absoluta de la monotonicidad', () => {
        const astDoc = createDoc([createNode(0, 'Artículo 1.')], 'AST');
        const domDoc = createDoc([createNode(0, 'Artículo 1.')], 'DOM');

        const astExtraction = StructuralAnchorExtractor.extract(astDoc);
        const domExtraction = StructuralAnchorExtractor.extract(domDoc);

        const result = AnchorAlignmentEngine.align(astDoc, domDoc, astExtraction, domExtraction);

        const ambiguous = result.alignments.find(a => a.status === 'ALIGN.AMBIGUOUS');
        expect(ambiguous).toBeUndefined();
    });

    test('9. Inmutabilidad estricta de los documentos de entrada', () => {
        const astDoc = createDoc([createNode(0, 'Artículo 50.')], 'AST');
        const domDoc = createDoc([createNode(0, 'Artículo 50.')], 'DOM');
        const astExtraction = StructuralAnchorExtractor.extract(astDoc);
        const domExtraction = StructuralAnchorExtractor.extract(domDoc);

        const cloneAst = JSON.parse(JSON.stringify(astDoc));
        const cloneDom = JSON.parse(JSON.stringify(domDoc));

        AnchorAlignmentEngine.align(astDoc, domDoc, astExtraction, domExtraction);

        expect(astDoc).toEqual(cloneAst);
        expect(domDoc).toEqual(cloneDom);
    });

});