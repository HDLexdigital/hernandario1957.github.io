'use strict';

const contract = require('../mvp-033-collection-export.contract.json');

describe('MVP-033 Collection Export Contract', () => {
    test('Define exportación pública estática sin base de datos ni mutación LEDM', () => {
        expect(contract.principles.public).toBe(true);
        expect(contract.principles.readOnly).toBe(true);
        expect(contract.principles.stateless).toBe(true);
        expect(contract.principles.noDatabase).toBe(true);
        expect(contract.principles.noLedmMutation).toBe(true);
    });

    test('Define salida collection-export.json', () => {
        expect(contract.output.file).toBe('public/collection-export.json');
    });

    test('Consume catálogo, línea de tiempo global y métricas', () => {
        expect(contract.source.catalog).toBe('public/catalogo.json');
        expect(contract.source.timeline).toBe('public/global-timeline.json');
        expect(contract.source.metrics).toBe('public/build-metrics.json');
    });

    test('Define esquema con campos requeridos', () => {
        expect(contract.schema.required).toEqual(
            expect.arrayContaining(['exportedAt', 'catalog', 'timeline', 'metrics'])
        );
    });
});
