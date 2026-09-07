'use strict';

const { generarFeed } = require('../../../scripts/build-feed');

describe('MVP-026 Feed Builder', () => {
    test('generarFeed produce RSS 2.0 válido', () => {
        const novedades = [
            {
                documentId: 'DOC-A',
                versionId: 'v1',
                createdAt: '2026-09-01T00:00:00Z',
                title: 'Norma A',
                url: '/DOC-A/v1/'
            }
        ];

        const xml = generarFeed(novedades);
        expect(xml).toContain('<?xml version="1.0"');
        expect(xml).toContain('<rss version="2.0">');
        expect(xml).toContain('<title>Norma A</title>');
        expect(xml).toContain('<link>https://digitalhd.com/DOC-A/v1/</link>');
    });

    test('generarFeed escapa caracteres especiales', () => {
        const novedades = [
            {
                documentId: 'DOC-B',
                versionId: 'v1',
                createdAt: '2026-09-01T00:00:00Z',
                title: 'Norma & Especial <Ley>',
                url: '/DOC-B/v1/'
            }
        ];

        const xml = generarFeed(novedades);
        expect(xml).toContain('Norma &amp; Especial &lt;Ley&gt;');
        expect(xml).not.toContain('<Ley>');
    });
});
