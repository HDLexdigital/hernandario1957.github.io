'use strict';
describe('Constructor XHTML - Suite Consolidada', () => {
    describe('Generación Básica', () => {
        test('Debe generar XHTML válido', () => {
            const { constructorXHTML } = require('../../../src/core/constructores/constructorXHTML');
            const documento = {
                titulo: 'Test',
                contenido: [
                    { tipo: 'parrafo', texto: 'Hola mundo' }
                ]
            };
            const xhtml = constructorXHTML(documento);
            expect(xhtml).toContain('<?xml version="1.0"');
            expect(xhtml).toContain('<!DOCTYPE html>');
            expect(xhtml).toContain('<p>Hola mundo</p>');
        });
        test('Debe manejar diferentes tipos de contenido', () => {
            const { constructorXHTML } = require('../../../src/core/constructores/constructorXHTML');
            const documento = {
                contenido: [
                    { tipo: 'titulo', texto: 'Título' },
                    { tipo: 'parrafo', texto: 'Párrafo' },
                    { tipo: 'nota', texto: 'Nota' }
                ]
            };
            const xhtml = constructorXHTML(documento);
            expect(xhtml).toContain('<h1>Título</h1>');
            expect(xhtml).toContain('<p>Párrafo</p>');
            expect(xhtml).toContain('<div class="nota">Nota</div>');
        });
    });
    describe('Escapado de Caracteres', () => {
        test('Debe escapar caracteres especiales', () => {
            const { constructorXHTML } = require('../../../src/core/constructores/constructorXHTML');
            const documento = {
                contenido: [
                    { tipo: 'parrafo', texto: '<script>alert("x")</script>' }
                ]
            };
            const xhtml = constructorXHTML(documento);
            expect(xhtml).not.toContain('<script>');
            expect(xhtml).toContain('&lt;script&gt;');
        });
    });
});