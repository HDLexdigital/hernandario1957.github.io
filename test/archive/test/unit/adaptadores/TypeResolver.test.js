'use strict';

const { resolverTipoBase } = require('../../../src/adaptadores/TypeResolver');

describe('TypeResolver — Semántica Base Lexmotor', () => {
    test('Debe resolver estilos de título a "parrafo"', () => {
        expect(resolverTipoBase('P02_TITLE_PART')).toBe('parrafo');
        expect(resolverTipoBase('P02_TITLE_MAIN')).toBe('parrafo');
    });

    test('Debe resolver estilos de cuerpo base a "parrafo"', () => {
        expect(resolverTipoBase('P01_BODY_BASE')).toBe('parrafo');
    });

    test('Debe resolver estilos de continuación a "parrafo"', () => {
        expect(resolverTipoBase('P01_BODY_CONT')).toBe('parrafo');
        expect(resolverTipoBase('P07_INDENT_L1')).toBe('parrafo');
    });

    test('Debe retornar null para estilos no mapeados', () => {
        expect(resolverTipoBase('P02_TITLE_BASE')).toBeNull();
        expect(resolverTipoBase(undefined)).toBeNull();
        expect(resolverTipoBase(null)).toBeNull();
        expect(resolverTipoBase('EstiloInventado')).toBeNull();
    });
});