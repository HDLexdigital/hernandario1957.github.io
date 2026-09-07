'use strict';

const contract = require('../mvp-041-public-home.contract.json');

describe('MVP-041 Public Home Contract', () => {
    test('Define portada pública estática sin base de datos ni mutación LEDM', () => {
        expect(contract.principles.public).toBe(true);
        expect(contract.principles.readOnly).toBe(true);
        expect(contract.principles.stateless).toBe(true);
        expect(contract.principles.noDatabase).toBe(true);
        expect(contract.principles.noLedmMutation).toBe(true);
    });

    test('Define salida como index.html', () => {
        expect(contract.output.dashboard).toBe('public/index.html');
    });

    test('Consume métricas y navegación', () => {
        expect(contract.source.metrics).toBe('public/build-metrics.json');
        expect(contract.source.nav).toBe('public/nav.html');
    });

    test('Define secciones de la portada', () => {
        expect(contract.sections).toEqual(
            expect.arrayContaining(['hero', 'metrics', 'navigation'])
        );
    });
});
