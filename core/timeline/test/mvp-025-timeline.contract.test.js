'use strict';

const contract = require('../mvp-025-timeline.contract.json');

describe('MVP-025 Timeline Contract', () => {
    test('Define línea de tiempo pública sin autenticación y sin base de datos', () => {
        expect(contract.principles.public).toBe(true);
        expect(contract.principles.readOnly).toBe(true);
        expect(contract.principles.stateless).toBe(true);
        expect(contract.principles.noDatabase).toBe(true);
        expect(contract.principles.noLedmMutation).toBe(true);
    });

    test('Define salida estática y endpoint público', () => {
        expect(contract.output.directory).toBe('public/timeline');
        expect(contract.output.filePattern).toBe('<documentId>.json');
        expect(contract.output.endpoint).toBe('/api/v1/public/timeline/:documentId');
        expect(contract.output.method).toBe('GET');
        expect(contract.output.auth).toBe(false);
    });

    test('Define orden ascendente por createdAt', () => {
        expect(contract.sort.field).toBe('createdAt');
        expect(contract.sort.order).toBe('asc');
    });

    test('Define campos públicos esperados', () => {
        expect(contract.fields).toEqual(
            expect.arrayContaining(['documentId', 'versionId', 'createdAt', 'title', 'url'])
        );
    });
});
