'use strict';
describe('Compilador LexMotor - Suite Consolidada', () => {
    describe('Carga del Módulo', () => {
        test('Debe cargar el compilador', () => {
            const compilador = require('../../../src/core/compiladores/compilarLexmotor');
            expect(compilador).toBeDefined();
            expect(compilador.compilarLexmotor).toBeDefined();
        });
        test('compilarLexmotor debe ser función', () => {
            const { compilarLexmotor } = require('../../../src/core/compiladores/compilarLexmotor');
            expect(typeof compilarLexmotor).toBe('function');
        });
    });
    describe('Compilación Básica', () => {
        test('Debe compilar documento simple', async () => {
            const { compilarLexmotor } = require('../../../src/core/compiladores/compilarLexmotor');
            const documento = {
                titulo: 'Test',
                contenido: [
                    { tipo: 'titulo', texto: 'Capítulo 1' },
                    { tipo: 'parrafo', texto: 'Contenido de prueba' }
                ]
            };
            const resultado = await compilarLexmotor(documento);
            expect(resultado).toBeDefined();
        });
    });
    describe('Manejo de Errores', () => {
        test('Debe manejar documento vacío', async () => {
            const { compilarLexmotor } = require('../../../src/core/compiladores/compilarLexmotor');
            const documento = {
                titulo: 'Vacío',
                contenido: []
            };
            const resultado = await compilarLexmotor(documento);
            expect(resultado).toBeDefined();
        });
    });
});