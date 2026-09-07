'use strict';

const contract = require('../mvp-038-public-exports.contract.json');

describe('MVP-038 Public Exports Contract', () => {
    test('Define panel público estático sin base de datos ni mutación LEDM', () => {
        expect(contract.principles.public).toBe(true);
        expect(contract.principles.readOnly).toBe(true);
        expect(contract.principles.stateless).toBe(true);
        expect(contract.principles.noDatabase).toBe(true);
        expect(contract.principles.noLedmMutation).toBe(true);
    });

    test('Define dashboard de exportaciones', () => {
        expect(contract.output.dashboard).toBe('public/exports.html');
    });

    test('Centraliza los formatos de exportación disponibles', () => {
        expect(contract.output.exports).toEqual(
            expect.arrayContaining([
                'collection-export.json',
                'collection-export.csv',
                'collection-export.ndjson',
                'feed.xml',
                'sitemap.xml',
                'build-metrics.json'
            ])
        );
    });

    test('Consume métricas de compilación', () => {
        expect(contract.source.buildMetrics).toBe('public/build-metrics.json');
    });
});
