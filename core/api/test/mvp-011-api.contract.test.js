'use strict';

const contract = require('../mvp-011-api.contract.json');

describe('MVP-011 API Contract', () => {
    test('El contrato define principios de solo lectura y sin base de datos', () => {
        expect(contract.principles.readOnly).toBe(true);
        expect(contract.principles.stateless).toBe(true);
        expect(contract.principles.noDatabaseRequired).toBe(true);
    });

    test('Se definen los cuatro endpoints canónicos obligatorios', () => {
        const paths = contract.endpoints.map(e => e.path);
        expect(paths).toEqual(
            expect.arrayContaining([
                '/api/v1/status',
                '/api/v1/index',
                '/api/v1/document/:id',
                '/api/v1/node/:nodeId'
            ])
        );
    });

    test('Todos los endpoints operan bajo el método GET', () => {
        contract.endpoints.forEach(endpoint => {
            expect(endpoint.method).toBe('GET');
        });
    });

    test('Los endpoints definen esquemas de respuesta JSON', () => {
        contract.endpoints.forEach(endpoint => {
            expect(endpoint.responseSchema).toBeDefined();
            expect(typeof endpoint.responseSchema).toBe('object');
        });
    });

    test('El manejo de errores especifica códigos estándar 404 y 500', () => {
        expect(contract.errorHandling.standardFormat).toBe(true);
        expect(contract.errorHandling.codes['404']).toBeDefined();
        expect(contract.errorHandling.codes['500']).toBeDefined();
    });
});
