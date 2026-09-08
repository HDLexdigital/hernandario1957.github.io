'use strict';

const contract = require('../mvp-023-public-search.contract.json');

describe('MVP-023 Public Search Contract', () => {
    test('Define búsqueda pública sin autenticación y sin base de datos', () => {
        expect(contract.principles.public).toBe(true);
        expect(contract.principles.readOnly).toBe(true);
        expect(contract.principles.stateless).toBe(true);
        expect(contract.principles.noDatabase).toBe(true);
        expect(contract.principles.noLedmMutation).toBe(true);
    });

    test('Define endpoint GET /api/v1/public/search sin auth', () => {
        expect(contract.endpoint.path).toBe('/api/v1/public/search');
        expect(contract.endpoint.method).toBe('GET');
        expect(contract.endpoint.auth).toBe(false);
    });

    test('Exige query, índice de búsqueda y límite de resultados', () => {
        expect(contract.validation.requireQuery).toBe(true);
        expect(contract.validation.requireSearchIndex).toBe(true);
        expect(contract.validation.maxResultsDefault).toBe(20);
        expect(contract.validation.minQueryLength).toBe(2);
    });
});
