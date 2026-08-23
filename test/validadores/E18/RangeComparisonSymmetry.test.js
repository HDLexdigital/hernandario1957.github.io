/**
 * E19.4.1 — Suite Contractual Sintética para Range Comparison Symmetry (MERGE / SPLIT)
 * 
 * Fase: RED
 * 
 * Contrato:
 * - ALIGN.MERGE colaciona el rango AST completo y lo compara contra el nodo DOM único.
 * - ALIGN.SPLIT colaciona el rango DOM completo y lo compara contra el nodo AST único.
 * - ALIGN.MATCH mantiene comparación directa 1:1.
 * - Cero normalización artificial, cero inferencia editorial (editorialEquivalence: 'NOT_DEMONSTRATED').
 * - Inmutabilidad absoluta y trazabilidad intacta.
 */

'use strict';

const RangeAwareReconciler = require('../../../src/validadores/E18/RangeAwareReconciler');

describe('E19.4.1 — Range Comparison Symmetry (Fase RED)', () => {

    const createNode = (index, text) => ({
        index,
        normalizedText: text,
        semanticType: 'parrafo',
        nodeKind: 'text',
        contentFingerprint: `sha256:mock-${text}`
    });

    const createDoc = (nodes, source = 'AST') => ({ version: '1.0.0', source, nodes });

    test('1. ALIGN.MERge colaciona el rango AST completo y produce TEXT.MATCH_EXACT si coincide con DOM', () => {
        const astDoc = createDoc([
            createNode(6, 'Artículo 1. Texto parte A. '),
            createNode(7, 'Texto parte B.')
        ], 'AST');
        const domDoc = createDoc([
            createNode(6, 'Artículo 1. Texto parte A. Texto parte B.')
        ], 'DOM');

        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [{ 
                status: 'ALIGN.MERGE', 
                astRange: [6, 7], 
                domRange: [6, 6], 
                evidence: { anchorType: 'ANCHOR_CONTAINMENT' } 
            }]
        };

        const result = RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        expect(result.reconciliations[0].status).toBe('ALIGN.MERGE');
        expect(result.reconciliations[0].text.status).toBe('TEXT.MATCH_EXACT');
        expect(result.reconciliations[0].editorialEquivalence).toBe('NOT_DEMONSTRATED');
    });

    test('2. ALIGN.MERGE produce TEXT.MISMATCH si la colación AST difiere del nodo DOM', () => {
        const astDoc = createDoc([
            createNode(6, 'Artículo 1. Parte A.'),
            createNode(7, ' Parte B alterada.')
        ], 'AST');
        const domDoc = createDoc([
            createNode(6, 'Artículo 1. Parte A. Parte B original.')
        ], 'DOM');

        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [{ 
                status: 'ALIGN.MERGE', 
                astRange: [6, 7], 
                domRange: [6, 6], 
                evidence: {} 
            }]
        };

        const result = RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        expect(result.reconciliations[0].status).toBe('ALIGN.MERGE');
        expect(result.reconciliations[0].text.status).toBe('TEXT.MISMATCH');
    });

    test('3. ALIGN.SPLIT colaciona el rango DOM completo y produce TEXT.MATCH_EXACT si coincide con AST', () => {
        const astDoc = createDoc([
            createNode(15, 'Artículo 9. Relaciones exteriores fundamentadas.')
        ], 'AST');
        const domDoc = createDoc([
            createNode(15, 'Artículo 9. Relaciones '),
            createNode(16, 'exteriores fundamentadas.')
        ], 'DOM');

        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [{ 
                status: 'ALIGN.SPLIT', 
                astRange: [15, 15], 
                domRange: [15, 16], 
                evidence: { anchorType: 'ANCHOR_CONTAINMENT' } 
            }]
        };

        const result = RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        expect(result.reconciliations[0].status).toBe('ALIGN.SPLIT');
        expect(result.reconciliations[0].text.status).toBe('TEXT.MATCH_EXACT');
        expect(result.reconciliations[0].editorialEquivalence).toBe('NOT_DEMONSTRATED');
    });

    test('4. ALIGN.SPLIT produce TEXT.MISMATCH si la colación DOM difiere del nodo AST', () => {
        const astDoc = createDoc([
            createNode(15, 'Artículo 9. Texto original completo.')
        ], 'AST');
        const domDoc = createDoc([
            createNode(15, 'Artículo 9. Texto '),
            createNode(16, 'modificado.')
        ], 'DOM');

        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [{ 
                status: 'ALIGN.SPLIT', 
                astRange: [15, 15], 
                domRange: [15, 16], 
                evidence: {} 
            }]
        };

        const result = RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        expect(result.reconciliations[0].status).toBe('ALIGN.SPLIT');
        expect(result.reconciliations[0].text.status).toBe('TEXT.MISMATCH');
    });

    test('5. Inmutabilidad absoluta y preservación de trazabilidad en simetría MERGE/SPLIT', () => {
        const astDoc = createDoc([createNode(0, 'A'), createNode(1, 'B')], 'AST');
        const domDoc = createDoc([createNode(0, 'AB')], 'DOM');

        const alignmentMap = {
            strategy: 'ALIGNMENT.ANCHOR_BASED',
            alignments: [{ status: 'ALIGN.MERGE', astRange: [0, 1], domRange: [0, 0], evidence: {} }]
        };

        const cloneAst = JSON.parse(JSON.stringify(astDoc));
        const cloneDom = JSON.parse(JSON.stringify(domDoc));

        RangeAwareReconciler.reconcile(astDoc, domDoc, alignmentMap);

        expect(astDoc).toEqual(cloneAst);
        expect(domDoc).toEqual(cloneDom);
    });

});