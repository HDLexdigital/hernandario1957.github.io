'use strict';

const contract = require('../mvp-016-admin.contract.json');

describe('MVP-016 Admin Contract', () => {
    test('Define panel de solo lectura protegido por API Key', () => {
        expect(contract.principles.readOnly).toBe(true);
        expect(contract.principles.protectedByApiKey).toBe(true);
        expect(contract.principles.noDatabase).toBe(true);
        expect(contract.principles.noLedmMutation).toBe(true);
    });

    test('Define endpoint de estado y dashboard protegido', () => {
        expect(contract.endpoints.status.path).toBe('/api/v1/admin/status');
        expect(contract.endpoints.status.method).toBe('GET');
        expect(contract.endpoints.dashboard.path).toBe('/admin');
        expect(contract.endpoints.dashboard.protected).toBe(true);
    });

    test('La validación exige API Key, catálogo, manifiestos y search-index', () => {
        expect(contract.validation.requireApiKey).toBe(true);
        expect(contract.validation.requireCatalog).toBe(true);
        expect(contract.validation.requireManifests).toBe(true);
        expect(contract.validation.requireSearchIndex).toBe(true);
        expect(contract.validation.failOnMissing).toBe(true);
    });
});