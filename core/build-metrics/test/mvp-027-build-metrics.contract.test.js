'use strict';

const contract = require('../mvp-027-build-metrics.contract.json');

describe('MVP-027 Build Metrics Contract', () => {
    test('Define métricas públicas sin autenticación y sin base de datos', () => {
        expect(contract.principles.public).toBe(true);
        expect(contract.principles.readOnly).toBe(true);
        expect(contract.principles.stateless).toBe(true);
        expect(contract.principles.noDatabase).toBe(true);
        expect(contract.principles.noLedmMutation).toBe(true);
    });

    test('Define archivo estático y endpoint público', () => {
        expect(contract.output.file).toBe('public/build-metrics.json');
        expect(contract.output.endpoint).toBe('/api/v1/public/build-metrics');
        expect(contract.output.method).toBe('GET');
        expect(contract.output.auth).toBe(false);
    });

    test('Define campos de métricas esperados', () => {
        expect(contract.fields).toEqual(
            expect.arrayContaining([
                'generatedAt',
                'totalDocuments',
                'totalVersions',
                'coreVersion',
                'ledmVersion',
                'checksum'
            ])
        );
    });

    test('Define fuentes de datos catálogo y manifiesto', () => {
        expect(contract.source.catalog).toBe('public/catalogo.json');
        expect(contract.source.manifest).toBe('public/manifest.json');
    });
});
