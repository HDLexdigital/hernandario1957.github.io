/**
 * E18.2.5.3-B.1 — Suite Contractual Sintética para WindowBoundaryResolver (10 Pruebas)
 * 
 * Fase: RED
 * 
 * Contrato:
 * - Delimita ventanas topológicas entre anclajes comunes consecutivos.
 * - Gestiona regiones pre-ancla (antes del primer hito) y post-ancla (después del último).
 * - Asigna pasivamente los nodos intermedios a la jurisdicción de la ventana local.
 * - No resuelve equivalencia interna (MATCH, MERGE, SPLIT), solo delimita dominios.
 * - Preserva la monotonicidad y la inmutabilidad absoluta del documento fuente.
 */

'use strict';

// El componente está bloqueado hasta que los tests fallen estructuralmente (Fase RED)
const WindowBoundaryResolver = require('../../../src/validadores/E18/WindowBoundaryResolver');

describe('E18.2.5.3-B.1 — WindowBoundaryResolver (Contrato Sintético - Fase RED)', () => {

    const createNode = (index, text) => ({
        index,
        normalizedText: text,
        semanticType: 'parrafo',
        nodeKind: 'text',
        contentFingerprint: `sha256:${text}`
    });

    const createDoc = (nodes, source = 'AST') => ({ version: '1.0.0', source, nodes });

    test('1. Dos anclajes consecutivos (ej. Artículo 70 a Artículo 71) delimitan una ventana exacta', () => {
        const astDoc = createDoc([
            createNode(0, 'Artículo 70. Texto.'),
            createNode(1, 'Párrafo intermedio A.'),
            createNode(2, 'Artículo 71. Siguiente.')
        ], 'AST');

        const domDoc = createDoc([
            createNode(0, 'Artículo 70. Texto DOM.'),
            createNode(1, 'Fragmento intermedio DOM.'),
            createNode(2, 'Artículo 71. Siguiente DOM.')
        ], 'DOM');

        const astAnchors = [
            { type: 'ARTICLE', key: '70', index: 0, rawText: 'Artículo 70. Texto.' },
            { type: 'ARTICLE', key: '71', index: 2, rawText: 'Artículo 71. Siguiente.' }
        ];
        const domAnchors = [
            { type: 'ARTICLE', key: '70', index: 0, rawText: 'Artículo 70. Texto DOM.' },
            { type: 'ARTICLE', key: '71', index: 2, rawText: 'Artículo 71. Siguiente DOM.' }
        ];

        const result = WindowBoundaryResolver.resolve(astDoc, domDoc, astAnchors, domAnchors);

        expect(result.windows).toHaveLength(2); // Ventana 70->71 y región post-ancla o cierre
        expect(result.windows[0].anchorKey).toBe('70');
        expect(result.windows[0].astRange).toEqual([0, 1]); // Incluye el anclaje y el párrafo intermedio
        expect(result.windows[0].domRange).toEqual([0, 1]);
    });

    test('2. Todos los nodos intermedios quedan estrictamente dentro de la jurisdicción de su ventana', () => {
        const astDoc = createDoc([
            createNode(0, 'Artículo 1.'),
            createNode(1, 'Intermedio 1'),
            createNode(2, 'Intermedio 2'),
            createNode(3, 'Artículo 2.')
        ], 'AST');
        const domDoc = createDoc([
            createNode(0, 'Artículo 1.'),
            createNode(1, 'Intermedio DOM'),
            createNode(2, 'Artículo 2.')
        ], 'DOM');

        const astAnchors = [
            { type: 'ARTICLE', key: '1', index: 0, rawText: 'Artículo 1.' },
            { type: 'ARTICLE', key: '2', index: 3, rawText: 'Artículo 2.' }
        ];
        const domAnchors = [
            { type: 'ARTICLE', key: '1', index: 0, rawText: 'Artículo 1.' },
            { type: 'ARTICLE', key: '2', index: 2, rawText: 'Artículo 2.' }
        ];

        const result = WindowBoundaryResolver.resolve(astDoc, domDoc, astAnchors, domAnchors);

        expect(result.windows[0].astRange).toEqual([0, 2]); // [Artículo 1 hasta antes de Artículo 2]
        expect(result.windows[0].domRange).toEqual([0, 1]);
    });

    test('3. Una fusión (MERGE) no genera nodos DOM huérfanos globales, sino que los contiene en la ventana', () => {
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

        // La ventana del Artículo 76 debe absorber el rango completo donde ocurre el merge
        const window76 = result.windows.find(w => w.anchorKey === '76');
        expect(window76.astRange).toEqual([0, 1]);
        expect(window76.domRange).toEqual([0, 0]);
        expect(result.summary.unmatchedDom).toBe(0); // No hay huérfanos globales
    });

    test('4. Una fragmentación (SPLIT) queda contenida dentro de los límites de la misma ventana de anclaje', () => {
        const astDoc = createDoc([createNode(0, 'Artículo 50.')], 'AST');
        const domDoc = createDoc([
            createNode(0, 'Artículo 50. Parte 1.'),
            createNode(1, 'Parte 2 de Artículo 50.')
        ], 'DOM');

        const astAnchors = [{ type: 'ARTICLE', key: '50', index: 0, rawText: 'Artículo 50.' }];
        const domAnchors = [{ type: 'ARTICLE', key: '50', index: 0, rawText: 'Artículo 50. Parte 1.' }];

        const result = WindowBoundaryResolver.resolve(astDoc, domDoc, astAnchors, domAnchors);

        const window50 = result.windows.find(w => w.anchorKey === '50');
        expect(window50.astRange).toEqual([0, 0]);
        expect(window50.domRange).toEqual([0, 1]); // Abarca ambos nodos DOM divididos
    });

    test('5. Los nodos situados antes del primer anclaje se agrupan en una región pre-ancla', () => {
        const astDoc = createDoc([
            createNode(0, 'Preámbulo o texto inicial sin hito.'),
            createNode(1, 'Artículo 1. Comienzo normativo.')
        ], 'AST');
        const domDoc = createDoc([
            createNode(0, 'Preámbulo DOM.'),
            createNode(1, 'Artículo 1. Comienzo DOM.')
        ], 'DOM');

        const astAnchors = [{ type: 'ARTICLE', key: '1', index: 1, rawText: 'Artículo 1. Comienzo normativo.' }];
        const domAnchors = [{ type: 'ARTICLE', key: '1', index: 1, rawText: 'Artículo 1. Comienzo DOM.' }];

        const result = WindowBoundaryResolver.resolve(astDoc, domDoc, astAnchors, domAnchors);

        expect(result.preAnchorRegion).toBeDefined();
        expect(result.preAnchorRegion.astRange).toEqual([0, 0]);
        expect(result.preAnchorRegion.domRange).toEqual([0, 0]);
    });

    test('6. Los nodos situados después del último anclaje se agrupan en una región post-ancla', () => {
        const astDoc = createDoc([
            createNode(0, 'Artículo 300. Final.'),
            createNode(1, 'Texto posterior o firmas de cierre.')
        ], 'AST');
        const domDoc = createDoc([
            createNode(0, 'Artículo 300. Final DOM.'),
            createNode(1, 'Texto posterior DOM.')
        ], 'DOM');

        const astAnchors = [{ type: 'ARTICLE', key: '300', index: 0, rawText: 'Artículo 300. Final.' }];
        const domAnchors = [{ type: 'ARTICLE', key: '300', index: 0, rawText: 'Artículo 300. Final DOM.' }];

        const result = WindowBoundaryResolver.resolve(astDoc, domDoc, astAnchors, domAnchors);

        expect(result.postAnchorRegion).toBeDefined();
        expect(result.postAnchorRegion.astRange).toEqual([1, 1]);
        expect(result.postAnchorRegion.domRange).toEqual([1, 1]);
    });

    test('7. Anclajes no coincidentes en ambas fuentes no fuerzan una ventana falsa ni corrompen el orden', () => {
        const astDoc = createDoc([createNode(0, 'Artículo 10.')], 'AST');
        const domDoc = createDoc([createNode(0, 'Artículo 99.')], 'DOM');

        const astAnchors = [{ type: 'ARTICLE', key: '10', index: 0, rawText: 'Artículo 10.' }];
        const domAnchors = [{ type: 'ARTICLE', key: '99', index: 0, rawText: 'Artículo 99.' }];

        const result = WindowBoundaryResolver.resolve(astDoc, domDoc, astAnchors, domAnchors);

        // Debe reportar un desajuste estructural sin crear una correspondencia inventada
        const unmatched = result.windows.filter(w => w.status === 'WINDOW.UNMATCHED');
        expect(unmatched.length).toBeGreaterThan(0);
    });

    test('8. Conservación estricta de la monotonicidad (cero cruces topológicos permitidos)', () => {
        const astDoc = createDoc([createNode(0, 'Art 1'), createNode(1, 'Art 2')], 'AST');
        const domDoc = createDoc([createNode(0, 'Art 2'), createNode(1, 'Art 1')], 'DOM');

        const astAnchors = [
            { type: 'ARTICLE', key: '1', index: 0, rawText: 'Art 1' },
            { type: 'ARTICLE', key: '2', index: 1, rawText: 'Art 2' }
        ];
        const domAnchors = [
            { type: 'ARTICLE', key: '2', index: 0, rawText: 'Art 2' },
            { type: 'ARTICLE', key: '1', index: 1, rawText: 'Art 1' }
        ];

        const result = WindowBoundaryResolver.resolve(astDoc, domDoc, astAnchors, domAnchors);

        expect(result.monotonicityViolated).toBe(true);
    });

    test('9. Inmutabilidad absoluta de los documentos y extracciones de anclajes originales', () => {
        const astDoc = createDoc([createNode(0, 'Artículo 1.')], 'AST');
        const domDoc = createDoc([createNode(0, 'Artículo 1.')], 'DOM');
        const astAnchors = [{ type: 'ARTICLE', key: '1', index: 0, rawText: 'Artículo 1.' }];
        const domAnchors = [{ type: 'ARTICLE', key: '1', index: 0, rawText: 'Artículo 1.' }];

        const astClone = JSON.parse(JSON.stringify(astDoc));
        const domClone = JSON.parse(JSON.stringify(domDoc));

        WindowBoundaryResolver.resolve(astDoc, domDoc, astAnchors, domAnchors);

        expect(astDoc).toEqual(astClone);
        expect(domDoc).toEqual(domClone);
    });

    test('10. El resolver no decide semántica interna ni MATCH/MERGE/SPLIT; solo define topología de límites', () => {
        const astDoc = createDoc([createNode(0, 'Artículo 5. Texto.')], 'AST');
        const domDoc = createDoc([createNode(0, 'Artículo 5. Texto.')], 'DOM');

        const astAnchors = [{ type: 'ARTICLE', key: '5', index: 0, rawText: 'Artículo 5. Texto.' }];
        const domAnchors = [{ type: 'ARTICLE', key: '5', index: 0, rawText: 'Artículo 5. Texto.' }];

        const result = WindowBoundaryResolver.resolve(astDoc, domDoc, astAnchors, domAnchors);

        // La ventana delimita rangos, pero deja la evaluación interna para el Window Aligner posterior
        expect(result.windows[0]).toHaveProperty('astRange');
        expect(result.windows[0]).toHaveProperty('domRange');
        expect(result.windows[0]).not.toHaveProperty('internalDiscrepancy');
    });

});