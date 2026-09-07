'use strict';

const contract = require('../mvp-037-public-search-relevance.contract.json');

describe('MVP-037 Public Search Relevance Contract', () => {
    test('Define panel público estático sin base de datos ni mutación LEDM', () => {
        expect(contract.principles.public).toBe(true);
        expect(contract.principles.readOnly).toBe(true);
        expect(contract.principles.stateless).toBe(true);
        expect(contract.principles.noDatabase).toBe(true);
        expect(contract.principles.noLedmMutation).toBe(true);
    });

    test('Define dashboard estático y fuente de datos', () => {
        expect(contract.output.dashboard).toBe('public/search-relevance.html');
        expect(contract.output.data).toBe('public/search-index.json');
    });

    test('Define ordenamiento por frecuencia de términos', () => {
        expect(contract.ranking.method).toBe('term-frequency');
        expect(contract.ranking.caseInsensitive).toBe(true);
        expect(contract.ranking.accentInsensitive).toBe(true);
    });
});
