'use strict';

const { PresentationResolver } = require('../../../src/resolucion/PresentationResolver');
const ErrorModulo = require('../../../src/errors/PresentationResolutionError');
const PresentationResolutionError = ErrorModulo.PresentationResolutionError || ErrorModulo;

describe('E12.5 — Pruebas Unitarias del PresentationResolver', () => {
    let resolver;

    beforeEach(() => {
        resolver = new PresentationResolver();
    });

    test('Resuelve estilo base canónico (P01_BODY_BASE)', () => {
        const nodo = { estiloParrafo: 'P01_BODY_BASE', tipo: 'parrafo' };
        // Validar que resuelva a algo válido (no nulo)
        expect(resolver.resolve(nodo)).not.toBeNull();
    });

    test('Tolerancia por defecto: Retorna null silencioso ante estilo desconocido para no romper compilación (Contrato C.12)', () => {
        const nodo = { estiloParrafo: 'P99_INVENTADO', tipo: 'parrafo' };
        expect(resolver.resolve(nodo)).toBeNull();
    });

    test('Estilo desconocido lanza PresentationResolutionError (Fallo estricto explícito)', () => {
        const nodo = { estiloParrafo: 'P99_ESTILO_INVENTADO', tipo: 'parrafo' };
        expect(() => resolver.resolve(nodo, true)).toThrow(PresentationResolutionError);
    });

    test('Nodo sin estilo de origen lanza PresentationResolutionError en modo estricto', () => {
        const nodo = { tipo: 'parrafo' };
        expect(() => resolver.resolve(nodo, true)).toThrow(PresentationResolutionError);
    });

    test('Inmutabilidad: El nodo del AST no es modificado de ninguna forma', () => {
        const nodo = { estiloParrafo: 'P01_BODY_BASE' };
        const clon = JSON.parse(JSON.stringify(nodo));
        resolver.resolve(nodo);
        expect(nodo).toEqual(clon);
    });
});