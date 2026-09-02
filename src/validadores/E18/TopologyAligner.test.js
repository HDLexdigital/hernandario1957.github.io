/**
 * E18.2.5.2 — Suite Contractual Sintética para TopologyAligner (10 Pruebas)
 * 
 * Fase: RED
 * 
 * Contrato:
 * - Correspondencia monotónica (cero cruces topológicos).
 * - Separación de estado topológico (MATCH, MERGE, SPLIT, etc.) y evidencia (TEXT_EXACT, etc.).
 * - Prohibición semántica (semanticType no ancla por sí solo).
 * - Resolución honesta de ambigüedad (AMBIGUOUS).
 * - Inmutabilidad absoluta.
 */

'use strict';

// El componente está bloqueado hasta que los tests fallen estructuralmente (Fase RED)
const TopologyAligner = require('../../../src/validadores/E18/TopologyAligner');

describe('E18.2.5.2 — TopologyAligner (Contrato Sintético - Fase RED)', () => {

    const createNode = (index, text, semanticType = 'parrafo') => ({
        index,
        normalizedText: text,
        semanticType,
        nodeKind: 'text',
        contentFingerprint: `sha256:${text}`
    });

    const createDoc = (nodes) => ({ version: '1.0.0', nodes });

    test('1. ALIGN.MATCH con evidencia TEXT_EXACT (1:1)', () => {
        const ast = createDoc([createNode(0, 'Artículo 1. Texto exacto.')]);
        const dom = createDoc([createNode(0, 'Artículo 1. Texto exacto.')]);
        
        const result = TopologyAligner.align(ast, dom);
        
        expect(result.alignments).toHaveLength(1);
        expect(result.alignments[0].status).toBe('ALIGN.MATCH');
        expect(result.alignments[0].astRange).toEqual([0, 0]);
        expect(result.alignments[0].domRange).toEqual([0, 0]);
        expect(result.alignments[0].evidence.anchorType).toBe('TEXT_EXACT');
    });

    test('2. ALIGN.MERGE con evidencia TEXT_CONTAINMENT (N:1)', () => {
        const ast = createDoc([
            createNode(0, 'Artículo 76. Texto A.'),
            createNode(1, 'Artículo 77. Texto B.')
        ]);
        const dom = createDoc([
            createNode(0, 'Artículo 76. Texto A. Artículo 77. Texto B.')
        ]);
        
        const result = TopologyAligner.align(ast, dom);
        
        expect(result.alignments).toHaveLength(1);
        expect(result.alignments[0].status).toBe('ALIGN.MERGE');
        expect(result.alignments[0].astRange).toEqual([0, 1]);
        expect(result.alignments[0].domRange).toEqual([0, 0]);
        expect(result.alignments[0].evidence.anchorType).toBe('TEXT_CONTAINMENT');
    });

    test('3. ALIGN.SPLIT con evidencia TEXT_CONTAINMENT (1:N)', () => {
        const ast = createDoc([
            createNode(0, 'Párrafo largo que fue dividido en dos.')
        ]);
        const dom = createDoc([
            createNode(0, 'Párrafo largo que fue'),
            createNode(1, 'dividido en dos.')
        ]);
        
        const result = TopologyAligner.align(ast, dom);
        
        expect(result.alignments).toHaveLength(1);
        expect(result.alignments[0].status).toBe('ALIGN.SPLIT');
        expect(result.alignments[0].astRange).toEqual([0, 0]);
        expect(result.alignments[0].domRange).toEqual([0, 1]);
        expect(result.alignments[0].evidence.anchorType).toBe('TEXT_CONTAINMENT');
    });

    test('4. Ausencia de correspondencia: ALIGN.AST_UNMATCHED y ALIGN.DOM_UNMATCHED', () => {
        const ast = createDoc([createNode(0, 'Solo en AST')]);
        const dom = createDoc([createNode(0, 'Solo en DOM')]);
        
        const result = TopologyAligner.align(ast, dom);
        
        expect(result.summary.unmatchedAst).toBe(1);
        expect(result.summary.unmatchedDom).toBe(1);
        expect(result.alignments[0].status).toBe('ALIGN.AST_UNMATCHED');
        expect(result.alignments[1].status).toBe('ALIGN.DOM_UNMATCHED');
    });

    test('5. Prohibición Semántica: semanticType igual no fuerza MATCH si el texto difiere totalmente', () => {
        const ast = createDoc([createNode(0, 'Texto original', 'parrafo')]);
        const dom = createDoc([createNode(0, 'Contenido completamente distinto', 'parrafo')]);
        
        const result = TopologyAligner.align(ast, dom);
        
        // No debe inferir MATCH solo porque ambos son 'parrafo'
        expect(result.alignments[0].status).not.toBe('ALIGN.MATCH');
    });

    test('6. ALIGN.AMBIGUOUS: Evidencia equivalente (TEXT_EXACT) no permite elegir un ganador', () => {
        const ast = createDoc([createNode(0, 'Párrafo repetido')]);
        // El DOM tiene el mismo párrafo duplicado, imposible saber cuál corresponde al AST
        const dom = createDoc([
            createNode(0, 'Párrafo repetido'),
            createNode(1, 'Párrafo repetido')
        ]);
        
        const result = TopologyAligner.align(ast, dom);
        
        const ambiguousAlignments = result.alignments.filter(a => a.status === 'ALIGN.AMBIGUOUS');
        expect(ambiguousAlignments.length).toBeGreaterThan(0);
        expect(ambiguousAlignments[0].evidence.anchorType).toBe('AMBIGUOUS');
    });

    test('7. ALIGN.MATCH con evidencia TEXT_OVERLAP (Divergencia tipográfica o fragmentación menor)', () => {
        const ast = createDoc([createNode(0, 'filosófica\\\\.')]);
        const dom = createDoc([createNode(0, 'filosófica\\.')]);
        
        const result = TopologyAligner.align(ast, dom);
        
        expect(result.alignments[0].status).toBe('ALIGN.MATCH');
        expect(result.alignments[0].evidence.anchorType).toBe('TEXT_OVERLAP');
    });

    test('8. Monotonicidad: No se permiten cruces topológicos (inversión de orden)', () => {
        const ast = createDoc([
            createNode(0, 'A'),
            createNode(1, 'B')
        ]);
        const dom = createDoc([
            createNode(0, 'B'),
            createNode(1, 'A')
        ]);
        
        const result = TopologyAligner.align(ast, dom);
        
        // Si el algoritmo respeta la monotonicidad, o las deja UNMATCHED, 
        // o asume un orden base, pero NO debe cruzar astRange [0,0]->[1,1] y [1,1]->[0,0]
        const hasCrossedAlignments = result.alignments.some(a => 
            a.status === 'ALIGN.MATCH' && a.astRange[0] > a.domRange[0]
        );
        expect(hasCrossedAlignments).toBe(false);
    });

    test('9. El AlignmentMap respeta el esquema de reporte y no modifica AST ni DOM (Inmutabilidad)', () => {
        const ast = createDoc([createNode(0, 'Inmutable')]);
        const dom = createDoc([createNode(0, 'Inmutable')]);
        
        const astClone = JSON.parse(JSON.stringify(ast));
        const domClone = JSON.parse(JSON.stringify(dom));
        
        const result = TopologyAligner.align(ast, dom);
        
        // 1. Esquema del reporte
        expect(result.strategy).toBe('ALIGNMENT.CONTENT_ANCHORED');
        expect(result.summary).toHaveProperty('matches');
        expect(result.summary).toHaveProperty('merges');
        expect(result.summary).toHaveProperty('splits');
        
        // 2. Inmutabilidad
        expect(ast).toEqual(astClone);
        expect(dom).toEqual(domClone);
    });

    test('10. Evidencia estructural secuencial (STRUCTURAL_SEQUENCE) asiste cuando hay solapamiento parcial', () => {
        const ast = createDoc([
            createNode(0, 'Inicio'),
            createNode(1, 'Medio parcialmente cambiado'),
            createNode(2, 'Fin')
        ]);
        const dom = createDoc([
            createNode(0, 'Inicio'),
            createNode(1, 'Medio totalmente cambiado'),
            createNode(2, 'Fin')
        ]);
        
        const result = TopologyAligner.align(ast, dom);
        
        // El nodo 1 debería alinearse gracias a la evidencia de "pinza" (nodos 0 y 2 exactos)
        const middleAlignment = result.alignments.find(a => a.astRange[0] === 1 && a.domRange[0] === 1);
        expect(middleAlignment.status).toBe('ALIGN.MATCH');
        expect(middleAlignment.evidence.anchorType).toBe('STRUCTURAL_SEQUENCE');
    });

});