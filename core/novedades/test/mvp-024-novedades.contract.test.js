'use strict';

const contract = require('../mvp-024-novedades.contract.json');

describe('MVP-024 Novedades Contract', () => {
    test('Define API pública de novedades sin autenticación y sin base de datos', () => {
        expect(contract.principles.public).toBe(true);
        expect(contract.principles.readOnly).toBe(true);
        expect(contract.principles.stateless).toBe(true);
        expect(contract.principles.noDatabase).toBe(true);
        expect(contract.principles.noLedmMutation).toBe(true);
    });

    test('Define salida estática y endpoint público', () => {
        expect(contract.output.static).toBe('public/novedades.json');
        expect(contract.output.endpoint).toBe('/api/v1/public/novedades');
        expect(contract.output.method).toBe('GET');
        expect(contract.output.auth).toBe(false);
    });

    test('Define orden descendente por createdAt y límite 20', () => {
        expect(contract.sort.field).toBe('createdAt');
        expect(contract.sort.order).toBe('desc');
        expect(contract.limit).toBe(20);
    });

    test('Define campos públicos esperados', () => {
        expect(contract.fields).toEqual(
            expect.arrayContaining(['documentId', 'title', 'versionId', 'createdAt', 'url'])
        );
    });
});
