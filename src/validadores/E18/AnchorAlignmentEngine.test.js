/**
 * E18.2.5.3-B.2 — Suite Contractual Sintética para AnchorAlignmentEngine
 * 
 * Fase: RED
 * 
 * Contrato:
 * - Recibe extracciones de anclajes (AST y DOM).
 * - Empareja anclajes compatibles por tipo y clave.
 * - Respeta estrictamente la monotonicidad (cero cruces).
 * - Genera ventanas y determina topología local (MATCH, MERGE, SPLIT, UNMATCHED, AMBIGUOUS).
 * - Inmutabilidad absoluta y ausencia de inferencia editorial o semántica.
 */

'use strict';

// El componente está bloqueado hasta que los tests fallen estructuralmente (Fase RED)
const AnchorAlignmentEngine = require('../../../src/validadores/E18/AnchorAlignmentEngine');

describe('E18.2.5.3-B.2 — AnchorAlignmentEngine (Contrato Sintético - Fase RED)', () => {

    const createNode = (index, text) => ({
        index,
        normalizedText: text,
        semanticType: 'parrafo',
        nodeKind: 'text',
        contentFingerprint: `sha256:${text}`
    });

    const createDoc = (nodes, source = 'AST') => ({ version: '1.0.0', source, nodes });

    const createExtractedAnchor = (type, key, index, rawText) => ({
        type,
        key,
        index,
        rawText
    });

    test('1. Alineación 1:1 perfecta entre anclajes homólogos produce ALIGN.MATCH', () => {
        const astDoc = createDoc([
            createNode(0, 'Artículo 1. Texto AST.')
        ], 'AST');

        const domDoc = createDoc([
            createNode(0, 'Artículo 1. Texto DOM.')
        ], 'DOM');

        const astExtraction = { source: 'AST', anchors: [createExtractedAnchor('ARTICLE', '1', 0, 'Artículo 1. Texto AST.')] };
        const domExtraction = { source: 'DOM', anchors: [createExtractedAnchor('ARTICLE', '1', 0, 'Artículo 1. Texto DOM.')] };

        const result = AnchorAlignmentEngine.align(astDoc, domDoc, astExtraction, domExtraction);

        expect(result.alignments).toHaveLength(1);
        expect(result.alignments[0].status).toBe('ALIGN.MATCH');
        expect(result.alignments[0].astRange).toEqual([0, 0]);
        expect(result.alignments[0].domRange).toEqual([0, 0]);
    });

    test('2. Fusión de dos nodos AST en un nodo DOM produce ALIGN.MERGE (N:1)', () => {
        const astDoc = createDoc([
            createNode(0, 'Artículo 76. Texto A.'),
            createNode(1, 'Artículo 77. Texto B.')
        ], 'AST');

        const domDoc = createDoc([
            createNode(0, 'Artículo 76. Texto A. Artículo 77. Texto B.')
        ], 'DOM');

        const astExtraction = { 
            source: 'AST', 
            anchors: [
                createExtractedAnchor('ARTICLE', '76', 0, 'Artículo 76. Texto A.'),
                createExtractedAnchor('ARTICLE', '77', 1, 'Artículo 77. Texto B.')
            ] 
        };
        const domExtraction = { 
            source: 'DOM', 
            anchors: [
                createExtractedAnchor('ARTICLE', '76', 0, 'Artículo 76. Texto A. Artículo 77. Texto B.') // Contiene ambos hitos
            ] 
        };

        const result = AnchorAlignmentEngine.align(astDoc, domDoc, astExtraction, domExtraction);

        const mergeAlignment = result.alignments.find(a => a.status === 'ALIGN.MERGE');
        expect(mergeAlignment).toBeDefined();
        expect(mergeAlignment.astRange).toEqual([0, 1]);
        expect(mergeAlignment.domRange).toEqual([0, 0]);
    });

    test('3. Fragmentación de un nodo AST en múltiples nodos DOM produce ALIGN.SPLIT (1:N)', () => {
        const astDoc = createDoc([
            createNode(0, 'Artículo 50. Texto completo fragmentado.')
        ], 'AST');

        const domDoc = createDoc([
            createNode(0, 'Artículo 50. Parte uno.'),
            createNode(1, 'Parte dos.')
        ], 'DOM');

        const astExtraction = { 
            source: 'AST', 
            anchors: [createExtractedAnchor('ARTICLE', '50', 0, 'Artículo 50. Texto completo fragmentado.')] 
        };
        const domExtraction = { 
            source: 'DOM', 
            anchors: [createExtractedAnchor('ARTICLE', '50', 0, 'Artículo 50. Parte uno.')] 
        };

        const result = AnchorAlignmentEngine.align(astDoc, domDoc, astExtraction, domExtraction);

        const splitAlignment = result.alignments.find(a => a.status === 'ALIGN.SPLIT');
        expect(splitAlignment).toBeDefined();
        expect(splitAlignment.astRange).toEqual([0, 0]);
        expect(splitAlignment.domRange).toEqual([0, 1]);
    });

    test('4. Anclaje presente en AST pero ausente en DOM produce ALIGN.AST_UNMATCHED', () => {
        const astDoc = createDoc([createNode(0, 'Artículo 99. Fantasma.')], 'AST');
        const domDoc = createDoc([createNode(0, 'Texto sin anclaje.')], 'DOM');

        const astExtraction = { source: 'AST', anchors: [createExtractedAnchor('ARTICLE', '99', 0, 'Artículo 99. Fantasma.')] };
        const domExtraction = { source: 'DOM', anchors: [] };

        const result = AnchorAlignmentEngine.align(astDoc, domDoc, astExtraction, domExtraction);

        const unmatched = result.alignments.find(a => a.status === 'ALIGN.AST_UNMATCHED');
        expect(unmatched).toBeDefined();
        expect(unmatched.astRange).toEqual([0, 0]);
    });

    test('5. Respeto absoluto a la monotonicidad: cruces de anclajes generan ALIGN.AMBIGUOUS o rechazo', () => {
        const astDoc = createDoc([
            createNode(0, 'Artículo 1.'),
            createNode(1, 'Artículo 2.')
        ], 'AST');

        const domDoc = createDoc([
            createNode(0, 'Artículo 2.'),
            createNode(1, 'Artículo 1.')
        ], 'DOM');

        // Extracciones con orden invertido artificialmente en el DOM
        const astExtraction = { 
            source: 'AST', 
            anchors: [
                createExtractedAnchor('ARTICLE', '1', 0, 'Artículo 1.'),
                createExtractedAnchor('ARTICLE', '2', 1, 'Artículo 2.')
            ] 
        };
        const domExtraction = { 
            source: 'DOM', 
            anchors: [
                createExtractedAnchor('ARTICLE', '2', 0, 'Artículo 2.'),
                createExtractedAnchor('ARTICLE', '1', 1, 'Artículo 1.')
            ] 
        };

        const result = AnchorAlignmentEngine.align(astDoc, domDoc, astExtraction, domExtraction);

        // El motor debe detectar la violación monótona y reportar ambigüedad o fallo de cruce
        const hasCrossedOrAmbiguous = result.alignments.some(a => a.status === 'ALIGN.AMBIGUOUS');
        expect(hasCrossedOrAmbiguous).toBe(true);
    });

    test('6. Inmutabilidad absoluta de los documentos y extracciones originales', () => {
        const astDoc = createDoc([createNode(0, 'Artículo 1.')], 'AST');
        const domDoc = createDoc([createNode(0, 'Artículo 1.')], 'DOM');
        const astExtraction = { source: 'AST', anchors: [createExtractedAnchor('ARTICLE', '1', 0, 'Artículo 1.')] };
        const domExtraction = { source: 'DOM', anchors: [createExtractedAnchor('ARTICLE', '1', 0, 'Artículo 1.')] };

        const astClone = JSON.parse(JSON.stringify(astDoc));
        const domClone = JSON.parse(JSON.stringify(domDoc));

        AnchorAlignmentEngine.align(astDoc, domDoc, astExtraction, domExtraction);

        expect(astDoc).toEqual(astClone);
        expect(domDoc).toEqual(domClone);
    });

});