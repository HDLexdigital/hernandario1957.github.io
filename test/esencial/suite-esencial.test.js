'use strict';
describe('Suite Esencial LexDigital', () => {
    describe('Carga del Módulo', () => {
        test('Debe cargar la API principal', () => {
            const lexdigital = require('../../src');
            expect(lexdigital.version).toBe('2.0.0');
            expect(lexdigital.compilar).toBeDefined();
            expect(lexdigital.validar).toBeDefined();
        });
    });
    describe('Compilación', () => {
        test('Debe compilar documento simple', async () => {
            const lexdigital = require('../../src');
            const documento = {
                titulo: 'Test',
                contenido: [
                    { tipo: 'parrafo', texto: 'Hola mundo' }
                ]
            };
            const resultado = await lexdigital.compilar(documento);
            expect(resultado).toBeDefined();
        });
    });
});