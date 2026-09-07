'use strict';

const contract = require('../mvp-039-public-collection.contract.json');

describe('MVP-039 Public Collection Contract', () => {
    test('Define panel público estático sin base de datos ni mutación LEDM', () => {
        expect(contract.principles.public).toBe(true);
        expect(contract.principles.readOnly).toBe(true);
        expect(contract.principles.stateless).toBe(true);
        expect(contract.principles.noDatabase).toBe(true);
        expect(contract.principles.noLedmMutation).toBe(true);
    });

    test('Define dashboard y fuente de datos', () => {
        expect(contract.output.dashboard).toBe('public/collection.html');
        expect(contract.output.data).toBe('public/collection-export.json');
    });

    test('Consume colección pública exportada', () => {
        expect(contract.source.collection).toBe('public/collection-export.json');
    });
});
