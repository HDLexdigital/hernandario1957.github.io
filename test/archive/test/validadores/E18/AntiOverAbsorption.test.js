/**
 * E18.3.1 — Suite Contractual Sintética Anti-Sobreabsorción (10 Pruebas)
 * 
 * Fase: RED
 * 
 * Contrato:
 * - Una ventana MERGE no puede extender su astRange por simple descarte o exclusión.
 * - Debe existir evidencia física en el nodo DOM de que el contenido abarcado está presente.
 * - La ausencia de evidencia genera un estado diagnóstico explícito: WINDOW_OVER_ABSORPTION.
 * - Protección estricta ante anclajes faltantes en el DOM sin absorción retrospectiva.
 * - Preservación absoluta de la monotonicidad, rangos contiguos legítimos y inmutabilidad.
 */

'use strict';

// El resolvedor con reglas anti-sobreabsorción está bloqueado (Fase RED)
const WindowBoundaryResolver = require('../../../src/validadores/E18/WindowBoundaryResolver');

describe('E18.3.1 — Anti-Over-Absorption Contract (Fase RED)', () => {

    const createNode = (index, text) => ({
        index,
        normalizedText: text,
        semanticType: 'parrafo',
        nodeKind: 'text',
        contentFingerprint: `sha256:${text}`
    });

    const createDoc = (nodes, source = 'AST') => ({ version: '1.0.0', source, nodes });

    test('1. Secuencia contigua normal AST[6,7] / DOM[6,7] no crea un MERGE automático sin evidencia', () => {
        const astDoc = createDoc([createNode(6, 'Artículo 1.'), createNode(7, 'Artículo 2.')], 'AST');
        const domDoc = createDoc([createNode(6, 'Artículo 1.'), createNode(7, 'Artículo 2.')], 'DOM');

        const astAnchors = [{ type: 'ARTICLE', key: '1', index: 6, rawText: 'Artículo 1.' }];
        const domAnchors = [{ type: 'ARTICLE', key: '1', index: 6, rawText: 'Artículo 1.' }];

        const result = WindowBoundaryResolver.resolve(astDoc, domDoc, astAnchors, domAnchors);

        // Sin solapamiento forzado de múltiples nodos en un único DOM, debe ser MATCH o contención limpia
        expect(result.windows).toBeDefined();
        expect(result.monotonicityViolated).toBe(false);
    });

    test('2. Rechaza MERGE si AST[6,7] apunta a DOM[6] pero DOM[6] contiene únicamente Artículo 1', () => {
        const astDoc = createDoc([
            createNode(6, 'Artículo 1. Texto de art 1.'),
            createNode(7, 'Artículo 2. Texto de art 2.')
        ], 'AST');
        const domDoc = createDoc([
            createNode(6, 'Artículo 1. Texto de art 1.')
        ], 'DOM');

        const astAnchors = [
            { type: 'ARTICLE', key: '1', index: 6, rawText: 'Artículo 1.' },
            { type: 'ARTICLE', key: '2', index: 7, rawText: 'Artículo 2.' }
        ];
        const domAnchors = [
            { type: 'ARTICLE', key: '1', index: 6, rawText: 'Artículo 1.' }
        ];

        const result = WindowBoundaryResolver.resolve(astDoc, domDoc, astAnchors, domAnchors);

        // El sistema no debe engullir el Artículo 2 en DOM[6] si no está físicamente presente
        const win = result.windows.find(w => w.anchorKey === '1');
        if (win && win.astRange) {
            expect(win.astRange).not.toEqual([6, 7]);
        }
        // Debe exponer un diagnóstico de sobreabsorción o dejar el nodo separado
        expect(result.overAbsorptionDetected || result.summary.merges === 0).toBeTruthy();
    });

    test('3. Permite MERGE válido si DOM[6] contiene físicamente el texto de Artículo 1 y Artículo 2', () => {
        const astDoc = createDoc([
            createNode(6, 'Art 1.'),
            createNode(7, 'Art 2.')
        ], 'AST');
        const domDoc = createDoc([
            createNode(6, 'Art 1. Art 2. Fusionados.')
        ], 'DOM');

        const astAnchors = [
            { type: 'ARTICLE', key: '1', index: 6, rawText: 'Art 1.' },
            { type: 'ARTICLE', key: '2', index: 7, rawText: 'Art 2.' }
        ];
        const domAnchors = [
            { type: 'ARTICLE', key: '1', index: 6, rawText: 'Art 1.' }
        ];

        const result = WindowBoundaryResolver.resolve(astDoc, domDoc, astAnchors, domAnchors);

        const win = result.windows.find(w => w.anchorKey === '1');
        expect(win.astRange).toEqual([6, 7]);
    });

    test('4. Anclaje posterior presente pero contenido intermedio incompatible rechaza la absorción', () => {
        const astDoc = createDoc([
            createNode(0, 'Art 1.'),
            createNode(1, 'Incompatible.'),
            createNode(2, 'Art 2.')
        ], 'AST');
        const domDoc = createDoc([
            createNode(0, 'Art 1.'),
            createNode(1, 'Contenido DOM diferente.')
        ], 'DOM');

        const astAnchors = [
            { type: 'ARTICLE', key: '1', index: 0, rawText: 'Art 1.' },
            { type: 'ARTICLE', key: '2', index: 2, rawText: 'Art 2.' }
        ];
        const domAnchors = [
            { type: 'ARTICLE', key: '1', index: 0, rawText: 'Art 1.' }
        ];

        const result = WindowBoundaryResolver.resolve(astDoc, domDoc, astAnchors, domAnchors);

        // No debe absorber el nodo intermedio incompatible
        const win = result.windows.find(w => w.anchorKey === '1');
        expect(win.astRange).not.toContain(2);
    });

    test('5. Anclaje faltante en DOM no debe extender indefinidamente el rango AST absorbido', () => {
        const astDoc = createDoc([
            createNode(0, 'Art 1'),
            createNode(1, 'Art 2'),
            createNode(2, 'Art 3')
        ], 'AST');
        const domDoc = createDoc([
            createNode(0, 'Art 1')
        ], 'DOM');

        const astAnchors = [
            { type: 'ARTICLE', key: '1', index: 0, rawText: 'Art 1' },
            { type: 'ARTICLE', key: '2', index: 1, rawText: 'Art 2' },
            { type: 'ARTICLE', key: '3', index: 2, rawText: 'Art 3' }
        ];
        const domAnchors = [
            { type: 'ARTICLE', key: '1', index: 0, rawText: 'Art 1' }
        ];

        const result = WindowBoundaryResolver.resolve(astDoc, domDoc, astAnchors, domAnchors);

        // La ausencia de contraparte DOM para Art 2 y Art 3 no autoriza un MERGE masivo ciego
        const win = result.windows.find(w => w.anchorKey === '1');
        if (win && win.astRange) {
            expect(win.astRange).toEqual([0, 0]);
        }
    });

    test('6. SPLIT auténtico se conserva intacto bajo validación física', () => {
        const astDoc = createDoc([createNode(0, 'Art 50 Completo.')], 'AST');
        const domDoc = createDoc([
            createNode(0, 'Art 50 Parte 1. '),
            createNode(1, 'Parte 2.')
        ], 'DOM');

        const astAnchors = [{ type: 'ARTICLE', key: '50', index: 0, rawText: 'Art 50' }];
        const domAnchors = [{ type: 'ARTICLE', key: '50', index: 0, rawText: 'Art 50' }];

        const result = WindowBoundaryResolver.resolve(astDoc, domDoc, astAnchors, domAnchors);

        const win = result.windows.find(w => w.anchorKey === '50');
        expect(win.domRange).toEqual([0, 1]);
    });

    test('7. Nodo DOM posterior independiente jamás debe absorberse retrospectivamente', () => {
        const astDoc = createDoc([createNode(0, 'A')], 'AST');
        const domDoc = createDoc([createNode(0, 'A'), createNode(1, 'Independiente B')], 'DOM');

        const astAnchors = [{ type: 'ARTICLE', key: '1', index: 0, rawText: 'A' }];
        const domAnchors = [
            { type: 'ARTICLE', key: '1', index: 0, rawText: 'A' },
            { type: 'ARTICLE', key: '2', index: 1, rawText: 'B' }
        ];

        const result = WindowBoundaryResolver.resolve(astDoc, domDoc, astAnchors, domAnchors);

        const win1 = result.windows.find(w => w.anchorKey === '1');
        expect(win1.domRange).toEqual([0, 0]);
    });

    test('8. Monotonicidad permanece estrictamente intacta', () => {
        const astDoc = createDoc([createNode(0, 'X')], 'AST');
        const domDoc = createDoc([createNode(0, 'X')], 'DOM');

        const astAnchors = [{ type: 'ARTICLE', key: '1', index: 0, rawText: 'X' }];
        const domAnchors = [{ type: 'ARTICLE', key: '1', index: 0, rawText: 'X' }];

        const result = WindowBoundaryResolver.resolve(astDoc, domDoc, astAnchors, domAnchors);

        expect(result.monotonicityViolated).toBe(false);
    });

    test('9. Los rangos contiguos válidos conservan sus límites lógicos', () => {
        const astDoc = createDoc([createNode(0, 'A'), createNode(1, 'B')], 'AST');
        const domDoc = createDoc([createNode(0, 'A'), createNode(1, 'B')], 'DOM');

        const astAnchors = [{ type: 'ARTICLE', key: '1', index: 0, rawText: 'A' }, { type: 'ARTICLE', key: '2', index: 1, rawText: 'B' }];
        const domAnchors = [{ type: 'ARTICLE', key: '1', index: 0, rawText: 'A' }, { type: 'ARTICLE', key: '2', index: 1, rawText: 'B' }];

        const result = WindowBoundaryResolver.resolve(astDoc, domDoc, astAnchors, domAnchors);

        expect(result.windows.length).toBe(2);
    });

    test('10. Inmutabilidad absoluta: entradas intactas', () => {
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