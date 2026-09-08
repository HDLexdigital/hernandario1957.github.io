'use strict';

const contract = require('../mvp-036-collection-ndjson.contract.json');

describe('MVP-036 Collection NDJSON Contract', () => {
    test('Define exportación pública estática sin base de datos ni mutación LEDM', () => {
        expect(contract.principles.public).toBe(true);
        expect(contract.principles.readOnly).toBe(true);
        expect(contract.principles.stateless).toBe(true);
        expect(contract.principles.noDatabase).toBe(true);
        expect(contract.principles.noLedmMutation).toBe(true);
    });

    test('Define salida NDJSON', () => {
        expect(contract.output.file).toBe('public/collection-export.ndjson');
    });

    test('Consume catálogo', () => {
        expect(contract.source.catalog).toBe('public/catalogo.json');
    });

    test('Define esquema de línea requerido', () => {
        expect(contract.lineSchema.required).toEqual(
            expect.arrayContaining(['documentId', 'title', 'versionId', 'createdAt', 'url'])
        );
    });
});
