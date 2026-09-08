'use strict';

const contract = require('../mvp-015-auth.contract.json');

describe('MVP-015 Auth Contract', () => {
    test('Define control de acceso por API Key sin base de datos', () => {
        expect(contract.principles.readOnly).toBe(true);
        expect(contract.principles.stateless).toBe(true);
        expect(contract.principles.noDatabase).toBe(true);
        expect(contract.principles.singleKeyPolicy).toBe(true);
        expect(contract.principles.envConfig).toBe(true);
    });

    test('Usa header x-api-key y variable de entorno', () => {
        expect(contract.auth.header).toBe('x-api-key');
        expect(contract.auth.environmentVariable).toBe('LEX_API_KEY');
        expect(contract.auth.required).toBe(true);
    });

    test('Rechaza peticiones sin clave o con clave inválida', () => {
        expect(contract.validation.requireApiKey).toBe(true);
        expect(contract.validation.rejectMissingKey).toBe(true);
        expect(contract.validation.rejectInvalidKey).toBe(true);
    });

    test('Define respuesta 401 estándar', () => {
        expect(contract.responses.unauthorized.status).toBe(401);
        expect(contract.responses.unauthorized.body.error).toBe('unauthorized');
    });
});