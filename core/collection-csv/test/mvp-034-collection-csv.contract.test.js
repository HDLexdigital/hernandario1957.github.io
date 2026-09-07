'use strict';

const contract = require('../mvp-034-collection-csv.contract.json');

describe('MVP-034 Collection CSV Contract', () => {
    test('Define exportación pública estática sin base de datos ni mutación LEDM', () => {
        expect(contract.principles.public).toBe(true);
        expect(contract.principles.readOnly).toBe(true);
        expect(contract.principles.stateless).toBe(true);
        expect(contract.principles.noDatabase).toBe(true);
        expect(contract.principles.noLedmMutation).toBe(true);
    });

    test('Define salida CSV pública', () => {
        expect(contract.output.file).toBe('public/collection-export.csv');
    });

    test('Consume catálogo y define columnas', () => {
        expect(contract.source.catalog).toBe('public/catalogo.json');
        expect(contract.columns).toEqual(
            expect.arrayContaining(['documentId', 'title', 'versionId', 'createdAt', 'url'])
        );
    });
});
