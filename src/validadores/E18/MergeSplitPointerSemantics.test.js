/**
 * E18.2.5.4-A — Suite Contractual Sintética para Merge/Split Pointer Semantics
 * 
 * Fase: RED
 * 
 * Contrato:
 * - El consumo topológico de un rango no equivale a un incremento físico ingenuo de nodo individual.
 * - Manejo independiente de cursores AST y DOM mediante rangos consumidos.
 * - MERGE no debe producir DOM_UNMATCHED espurios.
 * - SPLIT no debe producir AST_UNMATCHED espurios.
 * - Conservación estricta de la monotonicidad e inmutabilidad absoluta.
 */

'use strict';

// El componente o la extensión de semántica de punteros está bloqueada (Fase RED)
const WindowBoundaryResolver = require('../../../src/validadores/E18/WindowBoundaryResolver');

describe('E18.2.5.4-A — Merge/Split Pointer Semantics (Fase RED)', () => {

    const createNode = (index, text) => ({
        index,
        normalizedText: text,
        semanticType: 'parrafo',
        nodeKind: 'text',
        contentFingerprint: `sha256:${text}`
    });

    const createDoc = (nodes, source = 'AST') => ({ version: '1.0.0', source, nodes });

    test('1. MATCH puro: alineación 1:1 consume exactamente un rango unitario por cursor', () => {
        const astDoc = createDoc([createNode(0, 'Artículo 1. A.')], 'AST');
        const domDoc = createDoc([createNode(0, 'Artículo 1. A.')], 'DOM');

        const astAnchors = [{ type: 'ARTICLE', key: '1', index: 0, rawText: 'Artículo 1. A.' }];
        const domAnchors = [{ type: 'ARTICLE', key: '1', index: 0, rawText: 'Artículo 1. A.' }];

        const result = WindowBoundaryResolver.resolve(astDoc, domDoc, astAnchors, domAnchors);

        expect(result.windows[0].astRange).toEqual([0, 0]);
        expect(result.windows[0].domRange).toEqual([0, 0]);
        expect(result.summary.unmatchedDom || 0).toBe(0);
    });

    test('2. MERGE clásico: AST [A][B] frente a DOM [AB] consume múltiples AST para un solo DOM', () => {
        const astDoc = createDoc([
            createNode(0, 'Artículo 76.'),
            createNode(1, 'Artículo 77.')
        ], 'AST');
        const domDoc = createDoc([
            createNode(0, 'Artículo 76. Y Artículo 77 fusionados.')
        ], 'DOM');

        const astAnchors = [
            { type: 'ARTICLE', key: '76', index: 0, rawText: 'Artículo 76.' },
            { type: 'ARTICLE', key: '77', index: 1, rawText: 'Artículo 77.' }
        ];
        const domAnchors = [
            { type: 'ARTICLE', key: '76', index: 0, rawText: 'Artículo 76. Y Artículo 77 fusionados.' }
        ];

        const result = WindowBoundaryResolver.resolve(astDoc, domDoc, astAnchors, domAnchors);

        const win = result.windows.find(w => w.anchorKey === '76');
        expect(win.astRange).toEqual([0, 1]);
        expect(win.domRange).toEqual([0, 0]);
        expect(result.summary.unmatchedDom).toBe(0);
    });

    test('3. SPLIT clásico: AST [AB] frente a DOM [A][B] consume múltiples DOM para un solo AST', () => {
        const astDoc = createDoc([createNode(0, 'Artículo 50. Completo.')], 'AST');
        const domDoc = createDoc([
            createNode(0, 'Artículo 50. Parte 1.'),
            createNode(1, 'Parte 2.')
        ], 'DOM');

        const astAnchors = [{ type: 'ARTICLE', key: '50', index: 0, rawText: 'Artículo 50. Completo.' }];
        const domAnchors = [{ type: 'ARTICLE', key: '50', index: 0, rawText: 'Artículo 50. Parte 1.' }];

        const result = WindowBoundaryResolver.resolve(astDoc, domDoc, astAnchors, domAnchors);

        const win = result.windows.find(w => w.anchorKey === '50');
        expect(win.astRange).toEqual([0, 0]);
        expect(win.domRange).toEqual([0, 1]);
        expect(result.summary.unmatchedDom).toBe(0);
    });

    test('4. MERGE seguido de un siguiente anchor: el consumo del rango no desincroniza el cursor posterior', () => {
        const astDoc = createDoc([
            createNode(0, 'Artículo 10.'),
            createNode(1, 'Artículo 11.'),
            createNode(2, 'Artículo 12.')
        ], 'AST');
        const domDoc = createDoc([
            createNode(0, 'Artículo 10. Y 11 fusionados.'),
            createNode(1, 'Artículo 12.')
        ], 'DOM');

        const astAnchors = [
            { type: 'ARTICLE', key: '10', index: 0, rawText: 'Artículo 10.' },
            { type: 'ARTICLE', key: '11', index: 1, rawText: 'Artículo 11.' },
            { type: 'ARTICLE', key: '12', index: 2, rawText: 'Artículo 12.' }
        ];
        const domAnchors = [
            { type: 'ARTICLE', key: '10', index: 0, rawText: 'Artículo 10. Y 11 fusionados.' },
            { type: 'ARTICLE', key: '12', index: 1, rawText: 'Artículo 12.' }
        ];

        const result = WindowBoundaryResolver.resolve(astDoc, domDoc, astAnchors, domAnchors);

        // Debe resolver ambas ventanas de forma limpia sin dejar huérfanos falsos de Artículo 12
        const win10 = result.windows.find(w => w.anchorKey === '10');
        const win12 = result.windows.find(w => w.anchorKey === '12');

        expect(win10).toBeDefined();
        expect(win12).toBeDefined();
        expect(result.summary.unmatchedDom).toBe(0);
    });

    test('5. SPLIT seguido de un siguiente anchor: la fragmentación no absorbe indebidamente al siguiente hito', () => {
        const astDoc = createDoc([
            createNode(0, 'Artículo 20.'),
            createNode(1, 'Artículo 21.')
        ], 'AST');
        const domDoc = createDoc([
            createNode(0, 'Artículo 20. Parte A.'),
            createNode(1, 'Parte B.'),
            createNode(2, 'Artículo 21.')
        ], 'DOM');

        const astAnchors = [
            { type: 'ARTICLE', key: '20', index: 0, rawText: 'Artículo 20.' },
            { type: 'ARTICLE', key: '21', index: 1, rawText: 'Artículo 21.' }
        ];
        const domAnchors = [
            { type: 'ARTICLE', key: '20', index: 0, rawText: 'Artículo 20. Parte A.' },
            { type: 'ARTICLE', key: '21', index: 2, rawText: 'Artículo 21.' }
        ];

        const result = WindowBoundaryResolver.resolve(astDoc, domDoc, astAnchors, domAnchors);

        const win20 = result.windows.find(w => w.anchorKey === '20');
        const win21 = result.windows.find(w => w.anchorKey === '21');

        expect(win20.domRange).toEqual([0, 1]); // Abarca DOM 0 y 1
        expect(win21.domRange).toEqual([2, 2]); // Abarca DOM 2 limpiamente
    });

    test('6. MERGE y SPLIT consecutivos en un mismo documento operan bajo rango independiente', () => {
        const astDoc = createDoc([
            createNode(0, 'Art 1'),
            createNode(1, 'Art 2'),
            createNode(2, 'Art 3')
        ], 'AST');
        const domDoc = createDoc([
            createNode(0, 'Art 1 y 2 fusionados'),
            createNode(1, 'Art 3 parte 1'),
            createNode(2, 'Art 3 parte 2')
        ], 'DOM');

        const astAnchors = [
            { type: 'ARTICLE', key: '1', index: 0, rawText: 'Art 1' },
            { type: 'ARTICLE', key: '2', index: 1, rawText: 'Art 2' },
            { type: 'ARTICLE', key: '3', index: 2, rawText: 'Art 3' }
        ];
        const domAnchors = [
            { type: 'ARTICLE', key: '1', index: 0, rawText: 'Art 1 y 2 fusionados' },
            { type: 'ARTICLE', key: '3', index: 1, rawText: 'Art 3 parte 1' }
        ];

        const result = WindowBoundaryResolver.resolve(astDoc, domDoc, astAnchors, domAnchors);

        expect(result.windows.length).toBeGreaterThan(0);
        expect(result.monotonicityViolated).toBe(false);
    });

    test('7. Un MERGE no debe producir DOM_UNMATCHED espurios en el inventario final', () => {
        const astDoc = createDoc([createNode(0, 'A'), createNode(1, 'B')], 'AST');
        const domDoc = createDoc([createNode(0, 'AB')], 'DOM');

        const astAnchors = [{ type: 'ARTICLE', key: '1', index: 0, rawText: 'A' }, { type: 'ARTICLE', key: '2', index: 1, rawText: 'B' }];
        const domAnchors = [{ type: 'ARTICLE', key: '1', index: 0, rawText: 'AB' }];

        const result = WindowBoundaryResolver.resolve(astDoc, domDoc, astAnchors, domAnchors);

        expect(result. summary.unmatchedDom).toBe(0);
    });

    test('8. Un SPLIT no debe producir AST_UNMATCHED espurios', () => {
        const astDoc = createDoc([createNode(0, 'AB')], 'AST');
        const domDoc = createDoc([createNode(0, 'A'), createNode(1, 'B')], 'DOM');

        const astAnchors = [{ type: 'ARTICLE', key: '1', index: 0, rawText: 'AB' }];
        const domAnchors = [{ type: 'ARTICLE', key: '1', index: 0, rawText: 'A' }];

        const result = WindowBoundaryResolver.resolve(astDoc, domDoc, astAnchors, domAnchors);

        const unmatchedAst = result.windows.filter(w => w.status === 'WINDOW.UNMATCHED' && w.astRange.length > 0);
        expect(unmatchedAst.length).toBe(0);
    });

    test('9. Monotonicidad permanece intacta bajo semántica de rangos', () => {
        const astDoc = createDoc([createNode(0, 'X')], 'AST');
        const domDoc = createDoc([createNode(0, 'X')], 'DOM');

        const astAnchors = [{ type: 'ARTICLE', key: '1', index: 0, rawText: 'X' }];
        const domAnchors = [{ type: 'ARTICLE', key: '1', index: 0, rawText: 'X' }];

        const result = WindowBoundaryResolver.resolve(astDoc, domDoc, astAnchors, domAnchors);

        expect(result.monotonicityViolated).toBe(false);
    });

    test('10. Inmutabilidad absoluta: los documentos y arreglos de entrada no sufren mutación', () => {
        const astDoc = createDoc([createNode(0, 'Inmutable')], 'AST');
        const domDoc = createDoc([createNode(0, 'Inmutable')], 'DOM');
        const astAnchors = [{ type: 'ARTICLE', key: '1', index: 0, rawText: 'Inmutable' }];
        const domAnchors = [{ type: 'ARTICLE', key: '1', index: 0, rawText: 'Inmutable' }];

        const cloneAst = JSON.parse(JSON.stringify(astDoc));
        const cloneDom = JSON.parse(JSON.stringify(domDoc));

        WindowBoundaryResolver.resolve(astDoc, domDoc, astAnchors, domAnchors);

        expect(astDoc).toEqual(cloneAst);
        expect(domDoc).toEqual(cloneDom);
    });

});