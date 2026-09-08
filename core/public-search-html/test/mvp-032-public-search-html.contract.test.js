'use strict';

const contract = require('../mvp-032-public-search-html.contract.json');

describe('MVP-032 Public Search HTML Contract', () => {
    test('Define panel público estático sin base de datos ni mutación LEDM', () => {
        expect(contract.principles.public).toBe(true);
        expect(contract.principles.readOnly).toBe(true);
        expect(contract.principles.stateless).toBe(true);
        expect(contract.principles.noDatabase).toBe(true);
        expect(contract.principles.noLedmMutation).toBe(true);
    });

    test('Define dashboard estático y fuente de datos', () => {
        expect(contract.output.dashboard).toBe('public/search.html');
        expect(contract.output.data).toBe('public/search-index.json');
    });

    test('Consume search-index.json', () => {
        expect(contract.source.searchIndex).toBe('public/search-index.json');
    });
});
