'use strict';

const contract = require('../mvp-026-feed.contract.json');

describe('MVP-026 Feed Contract', () => {
    test('Define feed público, estático y sin base de datos', () => {
        expect(contract.principles.public).toBe(true);
        expect(contract.principles.readOnly).toBe(true);
        expect(contract.principles.stateless).toBe(true);
        expect(contract.principles.noDatabase).toBe(true);
        expect(contract.principles.noLedmMutation).toBe(true);
    });

    test('Define salida RSS 2.0', () => {
        expect(contract.output.file).toBe('public/feed.xml');
        expect(contract.output.format).toBe('rss');
        expect(contract.output.version).toBe('2.0');
    });

    test('Define origen desde novedades.json', () => {
        expect(contract.source.novedades).toBe('public/novedades.json');
    });

    test('Define mapeo de campos a items RSS', () => {
        expect(contract.items.title).toBe('title');
        expect(contract.items.link).toBe('url');
        expect(contract.items.pubDate).toBe('createdAt');
    });
});
