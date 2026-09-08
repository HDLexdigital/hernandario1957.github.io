'use strict';

const contract = require('../mvp-030-public-novedades.contract.json');

describe('MVP-030 Public Novedades Contract', () => {
    test('Define panel público estático sin base de datos ni mutación LEDM', () => {
        expect(contract.principles.public).toBe(true);
        expect(contract.principles.readOnly).toBe(true);
        expect(contract.principles.stateless).toBe(true);
        expect(contract.principles.noDatabase).toBe(true);
        expect(contract.principles.noLedmMutation).toBe(true);
    });

    test('Define dashboard estático de novedades', () => {
        expect(contract.output.dashboard).toBe('public/novedades.html');
        expect(contract.output.data).toBe('public/novedades.json');
    });

    test('Consume novedades.json', () => {
        expect(contract.source.novedades).toBe('public/novedades.json');
    });
});
