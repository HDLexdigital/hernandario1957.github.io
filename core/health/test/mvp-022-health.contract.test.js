'use strict';

const contract = require('../mvp-022-health.contract.json');

describe('MVP-022 Health Contract', () => {
    test('Define endpoint público sin autenticación y sin base de datos', () => {
        expect(contract.principles.public).toBe(true);
        expect(contract.principles.readOnly).toBe(true);
        expect(contract.principles.stateless).toBe(true);
        expect(contract.principles.noDatabase).toBe(true);
        expect(contract.principles.noLedmMutation).toBe(true);
    });

    test('Define ruta GET /api/v1/health sin auth', () => {
        expect(contract.endpoint.path).toBe('/api/v1/health');
        expect(contract.endpoint.method).toBe('GET');
        expect(contract.endpoint.auth).toBe(false);
    });

    test('Define esquema de respuesta mínima', () => {
        const required = contract.responseSchema.required;
        expect(required).toEqual(
            expect.arrayContaining(['status', 'version', 'timestamp'])
        );
    });
});
