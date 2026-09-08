'use strict';
describe('Integración LexDigital - Suite Consolidada', () => {
    describe('API Principal', () => {
        test('Debe cargar API completa', () => {
            const lexdigital = require('../../../src');
            expect(lexdigital.version).toBe('2.0.0');
            expect(lexdigital.compilar).toBeDefined();
            expect(lexdigital.validar).toBeDefined();
        });
        test('Debe compilar a través de API', async () => {
            const lexdigital = require('../../../src');
            const documento = {
                titulo: 'Documento de Prueba',
                contenido: [
                    { tipo: 'titulo', texto: 'Artículo 1' },
                    { tipo: 'parrafo', texto: 'Contenido del artículo' }
                ]
            };
            const resultado = await lexdigital.compilar(documento);
            expect(resultado).toBeDefined();
        });
    });
    describe('Validación', () => {
        test('Debe validar documento', () => {
            const lexdigital = require('../../../src');
            const documento = {
                contenido: [
                    { tipo: 'parrafo', texto: 'Test' }
                ]
            };
            const resultado = lexdigital.validar(documento);
            expect(resultado).toBeDefined();
        });
    });
});