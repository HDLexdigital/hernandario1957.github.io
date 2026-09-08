'use strict';

const contract = require('../mvp-040-public-nav.contract.json');

describe('MVP-040 Public Nav Contract', () => {
    test('Define panel público estático sin base de datos ni mutación LEDM', () => {
        expect(contract.principles.public).toBe(true);
        expect(contract.principles.readOnly).toBe(true);
        expect(contract.principles.stateless).toBe(true);
        expect(contract.principles.noDatabase).toBe(true);
        expect(contract.principles.noLedmMutation).toBe(true);
    });

    test('Define dashboard de navegación', () => {
        expect(contract.output.dashboard).toBe('public/nav.html');
    });

    test('Centraliza enlaces a todos los dashboards', () => {
        expect(contract.output.links).toEqual(
            expect.arrayContaining([
                'search.html',
                'search-advanced.html',
                'search-relevance.html',
                'novedades.html',
                'global-timeline.html',
                'metrics.html',
                'exports.html',
                'collection.html'
            ])
        );
    });
});
