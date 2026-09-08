'use strict';

const contract = require('../mvp-012-search.contract.json');

describe('MVP-012 Search Contract', () => {
    test('El contrato define principios de solo lectura y sin base de datos', () => {
        expect(contract.principles.readOnly).toBe(true);
        expect(contract.principles.stateless).toBe(true);
        expect(contract.principles.noDatabase).toBe(true);
        expect(contract.principles.prebuiltIndex).toBe(true);
    });

    test('El índice se genera desde indice.json y manifest.json', () => {
        expect(contract.index.source).toEqual(
            expect.arrayContaining(['public/indice.json', 'public/manifest.json'])
        );
        expect(contract.index.output).toBe('public/search-index.json');
    });

    test('El endpoint de búsqueda es GET con parámetros q y limit', () => {
        expect(contract.search.endpoint).toBe('/api/v1/search');
        expect(contract.search.method).toBe('GET');
        expect(contract.search.parameters.q).toBe('string');
        expect(contract.search.parameters.limit).toBe('number');
    });

    test('La validación exige índice y resultados', () => {
        expect(contract.validation.requireIndex).toBe(true);
        expect(contract.validation.requireResults).toBe(true);
        expect(contract.validation.maxResultsDefault).toBe(20);
        expect(contract.validation.minQueryLength).toBe(2);
    });
});
