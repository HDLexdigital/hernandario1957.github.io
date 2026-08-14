const { constructorXHTML } = require('../../../src/constructores/constructorXHTML');

describe('Fase E4: constructorXHTML', () => {

    test('1. Soporta objeto raíz con múltiples párrafos y estilos resueltos', () => {
        const ast = {
            documento: 'fragmento.indd',
            contenido: [
                {
                    tipoNodo: 'paragraph',
                    resolvedTag: 'p',
                    resolvedClass: 'body-base',
                    contenido: [
                        {
                            tipoNodo: 'character',
                            texto: 'Artículo 3. La ',
                            resolvedTag: null,
                            resolvedClass: null
                        },
                        {
                            tipoNodo: 'character',
                            texto: 'soberanía',
                            resolvedTag: 'span',
                            resolvedClass: 'glosario'
                        },
                        {
                            tipoNodo: 'character',
                            texto: ' reside.',
                            resolvedTag: null,
                            resolvedClass: null
                        }
                    ]
                }
            ]
        };

        const resultado = constructorXHTML(ast);

        expect(resultado).toBe(
            '<p class="body-base">Artículo 3. La <span class="glosario">soberanía</span> reside.</p>'
        );
    });

    test('2. Soporta un nodo de párrafo individual directamente', () => {
        const nodoParagraph = {
            tipoNodo: 'paragraph',
            resolvedTag: 'h1',
            resolvedClass: 'titulo-principal',
            contenido: [
                {
                    tipoNodo: 'character',
                    texto: 'Capítulo I',
                    resolvedTag: null,
                    resolvedClass: null
                }
            ]
        };

        const resultado = constructorXHTML(nodoParagraph);

        expect(resultado).toBe(
            '<h1 class="titulo-principal">Capítulo I</h1>'
        );
    });

    test('3. Aplica escape automático de caracteres especiales (&, <, >)', () => {
        const ast = {
            contenido: [
                {
                    tipoNodo: 'paragraph',
                    resolvedTag: 'p',
                    resolvedClass: 'norma',
                    contenido: [
                        {
                            tipoNodo: 'character',
                            texto: 'Si a < b y b & c, entonces > 0.',
                            resolvedTag: null,
                            resolvedClass: null
                        }
                    ]
                }
            ]
        };

        const resultado = constructorXHTML(ast);

        expect(resultado).toBe(
            '<p class="norma">Si a &lt; b y b &amp; c, entonces &gt; 0.</p>'
        );
    });

    test('4. Conserva el orden estricto de los character runs sin alterar texto', () => {
        const ast = {
            contenido: [
                {
                    tipoNodo: 'paragraph',
                    resolvedTag: 'p',
                    resolvedClass: 'texto',
                    contenido: [
                        {
                            tipoNodo: 'character',
                            texto: 'Primero ',
                            resolvedTag: null
                        },
                        {
                            tipoNodo: 'character',
                            texto: 'Segundo ',
                            resolvedTag: 'span',
                            resolvedClass: 'bold'
                        },
                        {
                            tipoNodo: 'character',
                            texto: 'Tercero',
                            resolvedTag: null
                        }
                    ]
                }
            ]
        };

        const resultado = constructorXHTML(ast);

        expect(resultado).toBe(
            '<p class="texto">Primero <span class="bold">Segundo </span>Tercero</p>'
        );
    });

    test('5. Retorna string vacío ante entradas nulas o inválidas', () => {
        expect(constructorXHTML(null)).toBe('');
        expect(constructorXHTML({})).toBe('');
        expect(constructorXHTML({ contenido: null })).toBe('');
    });
});