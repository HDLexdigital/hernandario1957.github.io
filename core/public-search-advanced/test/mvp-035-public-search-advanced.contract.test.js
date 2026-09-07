'use strict';

const contract = require('../mvp-035-public-search-advanced.contract.json');

describe('MVP-035 Public Search Advanced Contract', () => {
    test('Define panel público estático sin base de datos ni mutación LEDM', () => {
        expect(contract.principles.public).toBe(true);
        expect(contract.principles.readOnly).toBe(true);
        expect(contract.principles.stateless).toBe(true);
        expect(contract.principles.noDatabase).toBe(true);
        expect(contract.principles.noLedmMutation).toBe(true);
    });

    test('Define dashboard estático y fuente de datos', () => {
        expect(contract.output.dashboard).toBe('public/search-advanced.html');
        expect(contract.output.data).toBe('public/search-index.json');
    });

    test('Permite filtros por documento, versión y texto', () => {
        expect(contract.filters.allowed).toEqual(
            expect.arrayContaining(['documentId', 'versionId', 'text'])
        );
    });

    test('Consume search-index.json', () => {
        expect(contract.source.searchIndex).toBe('public/search-index.json');
    });
});
