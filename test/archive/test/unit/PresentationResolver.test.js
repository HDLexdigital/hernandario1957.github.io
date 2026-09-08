'use strict';

const path = require('path');
const { PresentationResolver } = require(path.resolve(__dirname, '../../src/resolucion/PresentationResolver'));
const { PresentationResolutionError } = require(path.resolve(__dirname, '../../src/errors/PresentationResolutionError'));

describe('E12.5 — Pruebas Unitarias del PresentationResolver', () => {
    const resolver = new PresentationResolver();

    test('P01_BODY_BASE → p01_body_base', () => {
        const nodo = { estiloParrafo: 'P01_BODY_BASE', tipo: 'parrafo' };
        expect(resolver.resolve(nodo)).toBe('p01_body_base');
    });

    test('P01_BODY_CONT → p01_body_cont', () => {
        const nodo = { estiloParrafo: 'P01_BODY_CONT', tipo: 'parrafo' };
        expect(resolver.resolve(nodo)).toBe('p01_body_cont');
    });

    test('P07_INDENT_L1 → p07_indent_l1', () => {
        const nodo = { estiloParrafo: 'P07_INDENT_L1', tipo: 'parrafo' };
        expect(resolver.resolve(nodo)).toBe('p07_indent_l1');
    });

    test('P02_TITLE_MAIN → p02_title_main', () => {
        const nodo = { estiloParrafo: 'P02_TITLE_MAIN', tipo: 'parrafo' };
        expect(resolver.resolve(nodo)).toBe('p02_title_main');
    });

    test('Estilo desconocido retorna null en modo no estricto (Contrato C.12)', () => {
        const nodo = { estiloParrafo: 'P99_ESTILO_INVENTADO', tipo: 'parrafo' };
        expect(resolver.resolve(nodo, false)).toBeNull();
    });

    test('Estilo desconocido lanza PresentationResolutionError (Fallo estricto)', () => {
        const nodo = { estiloParrafo: 'P99_ESTILO_INVENTADO', tipo: 'parrafo' };
        expect(() => resolver.resolve(nodo, true)).toThrow(PresentationResolutionError);
    });

    test('Nodo sin estilo de origen lanza PresentationResolutionError en modo estricto', () => {
        const nodo = { tipo: 'parrafo' };
        expect(() => resolver.resolve(nodo, true)).toThrow(PresentationResolutionError);
    });

    test('Inmutabilidad: El nodo del AST no es modificado de ninguna forma', () => {
        const nodo = { estiloParrafo: 'P01_BODY_BASE', tipo: 'parrafo' };
        const clon = JSON.parse(JSON.stringify(nodo));
        resolver.resolve(nodo);
        expect(nodo).toEqual(clon);
    });
});