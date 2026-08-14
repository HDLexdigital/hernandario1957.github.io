const { resolverTipoBase } = require('../../../src/adaptadores/TypeResolver');

describe('TypeResolver - Semántica Base Lexmotor', () => {
    test('Debe resolver estilos de título a "titulo_parte"', () => {
        expect(resolverTipoBase('P02_TITLE_PART')).toBe('titulo_parte');
        expect(resolverTipoBase('P02_TITLE_MAIN')).toBe('titulo_parte');
    });

    test('Debe resolver estilos de cuerpo base a "texto_cuerpo"', () => {
        expect(resolverTipoBase('P01_BODY_BASE')).toBe('texto_cuerpo');
    });

    test('Debe resolver estilos de continuación a "parrafo"', () => {
        expect(resolverTipoBase('P01_BODY_CONT')).toBe('parrafo');
        expect(resolverTipoBase('P07_INDENT_L1')).toBe('parrafo');
    });

    test('Debe retornar null para estilos sin evidencia empírica (ej. P02_TITLE_BASE)', () => {
        expect(resolverTipoBase('P02_TITLE_BASE')).toBeNull();
    });

    test('Debe retornar null para valores inválidos o no mapeados', () => {
        expect(resolverTipoBase(undefined)).toBeNull();
        expect(resolverTipoBase(null)).toBeNull();
        expect(resolverTipoBase('EstiloInventado')).toBeNull();
    });
});