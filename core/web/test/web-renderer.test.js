'use strict';

const {
    renderHtml,
    renderBlock,
    renderContentNode,
    generateNav,
    generateStaticIndex,
    normalizarBlocks
} = require('../WebRenderer');

describe('MVP-006 WebRenderer', () => {
    test('renderBlock genera título con nivel y id correctos', () => {
        const titleBlock = {
            type: 'title',
            nodeId: 'CO-CONST-T1',
            children: [{ type: 'text', text: 'Título I' }]
        };
        const html = renderBlock(titleBlock, 1);
        expect(html).toBe('<h1 id="CO-CONST-T1">Título I</h1>');
    });

    test('renderBlock genera article con id', () => {
        const articleBlock = {
            type: 'article',
            nodeId: 'CO-CONST-ART1',
            children: [{ type: 'text', text: 'Colombia es...' }]
        };
        const html = renderBlock(articleBlock);
        expect(html).toBe('<article id="CO-CONST-ART1">Colombia es...</article>');
    });

    test('renderBlock lanza error si nodeId es inválido o falta', () => {
        const invalidBlock = {
            type: 'paragraph',
            children: [{ type: 'text', text: 'Texto sin identificador' }]
        };
        expect(() => renderBlock(invalidBlock)).toThrow('nodeId inválido');
    });

    test('renderContentNode maneja texto, strong y emphasis', () => {
        expect(renderContentNode({ type: 'text', text: 'Hola' })).toBe('Hola');
        expect(renderContentNode({ type: 'strong', children: [{ type: 'text', text: 'fuerte' }] }))
            .toBe('<strong>fuerte</strong>');
        expect(renderContentNode({ type: 'emphasis', children: [{ type: 'text', text: 'enfatizado' }] }))
            .toBe('<em>enfatizado</em>');
    });

    test('escape HTML funciona correctamente', () => {
        const block = {
            type: 'paragraph',
            nodeId: 'TEST',
            children: [{ type: 'text', text: '<script>alert("x")</script>' }]
        };
        const html = renderBlock(block);
        expect(html).toBe('<p>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;</p>');
    });

    test('generateNav usa nodeId reales y fallbacks consistentes', () => {
        const ledm = {
            structure: {
                blocks: [
                    { type: 'title', nodeId: 'CO-CONST-T1', children: [{ type: 'text', text: 'Título I' }] },
                    { type: 'title', children: [{ type: 'text', text: 'Título II' }] }
                ]
            }
        };
        const nav = generateNav(ledm);
        expect(nav).toContain('<a href="#CO-CONST-T1">Título I</a>');
        expect(nav).toContain('<a href="#BLOCK-0001">Título II</a>');
    });

    test('generateStaticIndex extrae título y nodeId', () => {
        const ledm = {
            structure: {
                blocks: [
                    { type: 'title', nodeId: 'CO-CONST-T1', children: [{ type: 'text', text: 'Título I' }] }
                ]
            }
        };
        const index = generateStaticIndex(ledm);
        expect(index).toEqual([{ nodeId: 'CO-CONST-T1', title: 'Título I', text: 'Título I' }]);
    });

    test('renderHtml incluye metadatos, secciones y fallback determinista de nodeId', () => {
        const ledm = {
            meta: {
                model: 'LEDM-2.0',
                jurisdiction: 'CO',
                documentId: 'CO-CONST-1991'
            },
            structure: {
                title: 'Constitución',
                blocks: [
                    { type: 'title', nodeId: 'CO-CONST-T1', children: [{ type: 'text', text: 'Título I' }] },
                    { type: 'article', children: [{ type: 'text', text: 'Artículo 1' }] }
                ]
            }
        };
        const html = renderHtml(ledm);
        expect(html).toContain('<meta name="documentId" content="CO-CONST-1991">');
        expect(html).toContain('<section aria-labelledby="CO-CONST-T1">');
        expect(html).toContain('<article id="BLOCK-0001">Artículo 1</article>');
    });

    test('normalizarBlocks asigna fallback determinista en mayúsculas', () => {
        const blocks = [
            { type: 'paragraph', children: [{ type: 'text', text: 'uno' }] },
            { type: 'paragraph', children: [{ type: 'text', text: 'dos' }] }
        ];
        const normalized = normalizarBlocks(blocks);
        expect(normalized[0].nodeId).toBe('BLOCK-0001');
        expect(normalized[1].nodeId).toBe('BLOCK-0002');
    });

    test('rechaza nodeId inválido', () => {
    expect(() => {
        normalizarBlocks([{ type: 'paragraph', nodeId: 'NODE ID', children: [] }]);
    }).toThrow('nodeId inválido');
});

    test('rechaza nodeId duplicado', () => {
        const blocks = [
            { type: 'paragraph', nodeId: 'ABC', children: [] },
            { type: 'paragraph', nodeId: 'ABC', children: [] }
        ];
        expect(() => {
            normalizarBlocks(blocks);
        }).toThrow('nodeId duplicado');
    });

    test('no muta el LEDM original', () => {
        const ledm = {
            structure: {
                blocks: [
                    { type: 'paragraph', children: [{ type: 'text', text: 'uno' }] }
                ]
            }
        };
        const antes = JSON.stringify(ledm);
        renderHtml(ledm);
        expect(JSON.stringify(ledm)).toBe(antes);
    });
});