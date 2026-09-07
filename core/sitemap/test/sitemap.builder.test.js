'use strict';

const { generarSitemap, generarRobots } = require('../../../scripts/build-sitemap');

describe('MVP-020 Sitemap Builder', () => {
    test('generarSitemap produce XML válido', () => {
        const catalogo = [
            { documentId: 'DOC-A', versions: ['v1', 'v2'] },
            { documentId: 'DOC-B', versions: ['v1'] }
        ];

        const xml = generarSitemap(catalogo);
        expect(xml).toContain('<?xml version="1.0"');
        expect(xml).toContain('<urlset');
        expect(xml).toContain('https://digitalhd.com/DOC-A/');
        expect(xml).toContain('https://digitalhd.com/DOC-A/v1/');
        expect(xml).toContain('https://digitalhd.com/DOC-B/v1/');
    });

    test('generarRobots produce robots.txt esperado', () => {
        const robots = generarRobots();
        expect(robots).toContain('User-agent: *');
        expect(robots).toContain('Disallow: /admin');
        expect(robots).toContain('Sitemap: https://digitalhd.com/sitemap.xml');
    });
});
