'use strict';

const contract = require('../mvp-021-public-api.contract.json');

describe('MVP-021 Public API Contract', () => {
    test('Define API pública sin autenticación y sin base de datos', () => {
        expect(contract.principles.public).toBe(true);
        expect(contract.principles.readOnly).toBe(true);
        expect(contract.principles.stateless).toBe(true);
        expect(contract.principles.noDatabase).toBe(true);
        expect(contract.principles.noLedmMutation).toBe(true);
    });

    test('Define endpoints públicos de catálogo y documento', () => {
        expect(contract.endpoints[0].path).toBe('/api/v1/public/catalog');
        expect(contract.endpoints[0].auth).toBe(false);
        expect(contract.endpoints[1].path).toBe('/api/v1/public/document/:id');
        expect(contract.endpoints[1].auth).toBe(false);
    });

    test('La validación exige catálogo y resumen de documento', () => {
        expect(contract.validation.requireCatalog).toBe(true);
        expect(contract.validation.requireDocumentSummary).toBe(true);
        expect(contract.validation.failOnMissing).toBe(true);
    });
});
