'use strict';

const { PresentationResolver } = require('../../../src/resolucion/PresentationResolver');
const { PresentationResolutionError } = require('../../../src/errors/PresentationResolutionError');

describe('E12.5 — Pruebas Unitarias del PresentationResolver', () => {
    const resolver = new PresentationResolver();

    test('P01_BODY_BASE → cuerpo-siguiente', () => {
        const nodo = { estiloParrafo: 'P01_BODY_BASE', tipo: 'parrafo' };
        expect(resolver.resolve(nodo)).toBe('cuerpo-siguiente');
    });

    test('P01_BODY_CONT → cuerpo-siguiente', () => {
        const nodo = { estiloParrafo: 'P01_BODY_CONT', tipo: 'parrafo' };
        expect(resolver.resolve(nodo)).toBe('cuerpo-siguiente');
    });

    test('P07_INDENT_L1 → sangria-n1', () => {
        const nodo = { estiloParrafo: 'P07_INDENT_L1', tipo: 'parrafo' };
        expect(resolver.resolve(nodo)).toBe('sangria-n1');
    });

    test('P02_TITLE_MAIN → p02-title-main', () => {
        const nodo = { estiloParrafo: 'P02_TITLE_MAIN', tipo: 'parrafo' };
        expect(resolver.resolve(nodo)).toBe('p02-title-main');
    });

    test('P03_CENTER_BOLD → texto-centrado-bold', () => {
        const nodo = { estiloParrafo: 'P03_CENTER_BOLD', tipo: 'parrafo' };
        expect(resolver.resolve(nodo)).toBe('texto-centrado-bold');
    });

    test('Estilo desconocido lanza PresentationResolutionError (Fallo estricto)', () => {
        const nodo = { estiloParrafo: 'P99_ESTILO_INVENTADO', tipo: 'parrafo' };
        expect(() => resolver.resolve(nodo)).toThrow(PresentationResolutionError);
    });

    test('Nodo sin estilo de origen lanza PresentationResolutionError', () => {
        const nodo = { tipo: 'parrafo' };
        expect(() => resolver.resolve(nodo)).toThrow(PresentationResolutionError);
    });

    test('Inmutabilidad: El nodo del AST no es modificado de ninguna forma', () => {
        const nodoOriginal = { estiloParrafo: 'P01_BODY_BASE', tipo: 'parrafo', texto: 'Contenido legal' };
        const nodoCopia = JSON.parse(JSON.stringify(nodoOriginal));

        resolver.resolve(nodoOriginal);

        expect(nodoOriginal).toEqual(nodoCopia);
    });
});