const fs = require('fs');
const path = require('path');
const os = require('os');

const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');
const {
    validateCSSCoverage
} = require('../../src/validadores/validarCSSCoverage');

describe('E9 — Regresión funcional del pipeline Lexmotor', () => {
    let tempDir;
    let semanticMapPath;
    let profileMapPath;
    let dependencias;
    let astBase;
    let cssBase;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(
            path.join(os.tmpdir(), 'lexmotor-e9-regression-')
        );

        semanticMapPath = path.join(tempDir, 'semantic_map.json');
        profileMapPath = path.join(tempDir, 'profile_map.json');

        const semanticMap = {
            documentName: 'E9_Regresion.indd',
            exportDate: '2026-08-11',
            styles: [
                {
                    id: '1',
                    originalName: 'P01_BODY_BASE',
                    styleGroup: '',
                    type: 'paragraph',
                    exportTagging: {
                        epub: {
                            tag: 'p',
                            className: 'body-base',
                            attributes: null
                        },
                        pdf: {
                            tag: null,
                            className: null,
                            attributes: null
                        }
                    }
                },
                {
                    id: '2',
                    originalName: 'TerminoGlosario',
                    styleGroup: '',
                    type: 'character',
                    exportTagging: {
                        epub: {
                            tag: 'span',
                            className: 'glosario',
                            attributes: null
                        },
                        pdf: {
                            tag: null,
                            className: null,
                            attributes: null
                        }
                    }
                }
            ]
        };

        fs.writeFileSync(
            semanticMapPath,
            JSON.stringify(semanticMap, null, 2),
            'utf8'
        );

        fs.writeFileSync(
            profileMapPath,
            JSON.stringify({}, null, 2),
            'utf8'
        );

        cssBase = `
            .body-base {
                font-size: 10pt;
                line-height: 1.2;
                text-align: justify;
            }

            .glosario {
                font-weight: bold;
            }
        `;

        astBase = {
            documento: 'E9_Regresion.indd',
            contenido: [
                {
                    tipoNodo: 'paragraph',
                    estiloParrafo: 'P01_BODY_BASE',
                    inDesignStyle: 'P01_BODY_BASE',
                    contenido: [
                        {
                            tipoNodo: 'character',
                            texto: 'Artículo 1. ',
                            estiloCaracter: '[Ninguno]',
                            inDesignStyle: '[Ninguno]'
                        },
                        {
                            tipoNodo: 'character',
                            texto: 'Colombia',
                            estiloCaracter: 'TerminoGlosario',
                            inDesignStyle: 'TerminoGlosario'
                        },
                        {
                            tipoNodo: 'character',
                            texto: ' es un Estado social de derecho: a < b & c > 0.',
                            estiloCaracter: '[Ninguno]',
                            inDesignStyle: '[Ninguno]'
                        }
                    ]
                }
            ]
        };

        dependencias = {
            semanticMapPath,
            profileStyleMapPath: profileMapPath,
            outputFolder: tempDir
        };
    });

    afterEach(() => {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, {
                recursive: true,
                force: true
            });
        }
    });

    test('1. Conserva inmutable el AST original', async () => {
        const astOriginal = JSON.parse(JSON.stringify(astBase));

        await compilarLexmotor(astBase, dependencias);

        expect(astBase).toEqual(astOriginal);
    });

    test('2. Conserva la resolución semántica de párrafo', async () => {
        const resultado = await compilarLexmotor(
            astBase,
            dependencias
        );

        const parrafo = resultado.astEnriquecido.contenido[0];

        expect(parrafo.resolvedTag).toBe('p');
        expect(parrafo.resolvedClass).toBe('body-base');
        expect(parrafo.inDesignStyle).toBe('P01_BODY_BASE');
    });

    test('3. Conserva la resolución semántica de character runs', async () => {
        const resultado = await compilarLexmotor(
            astBase,
            dependencias
        );

        const runs =
            resultado.astEnriquecido.contenido[0].contenido;

        expect(runs[0].resolvedTag).toBeNull();

        expect(runs[1].resolvedTag).toBe('span');
        expect(runs[1].resolvedClass).toBe('glosario');

        expect(runs[2].resolvedTag).toBeNull();
    });

    test('4. Conserva el tratamiento de [Ninguno]', async () => {
        const resultado = await compilarLexmotor(
            astBase,
            dependencias
        );

        const runs =
            resultado.astEnriquecido.contenido[0].contenido;

        expect(runs[0].resolvedTag).toBeNull();
        expect(runs[0].resolvedClass).toBeUndefined();

        expect(runs[2].resolvedTag).toBeNull();
        expect(runs[2].resolvedClass).toBeUndefined();
    });

    test('5. Conserva el escape XHTML de caracteres especiales', async () => {
        const resultado = await compilarLexmotor(
            astBase,
            dependencias
        );

        expect(resultado.xhtml).toContain('&lt;');
        expect(resultado.xhtml).toContain('&amp;');
        expect(resultado.xhtml).toContain('&gt;');

        expect(resultado.xhtml).not.toContain('a < b');
        expect(resultado.xhtml).not.toContain('b & c');
        expect(resultado.xhtml).not.toContain('c > 0');
    });

    test('6. Conserva la estructura XHTML generada', async () => {
        const resultado = await compilarLexmotor(
            astBase,
            dependencias
        );

        expect(resultado.xhtml).toContain(
            '<p class="body-base">'
        );

        expect(resultado.xhtml).toContain(
            '<span class="glosario">Colombia</span>'
        );

        expect(resultado.xhtml).toContain(
            'Artículo 1.'
        );

        expect(resultado.xhtml).toContain(
            ' es un Estado social de derecho:'
        );
    });

    test('7. Conserva la persistencia física del XHTML', async () => {
        const resultado = await compilarLexmotor(
            astBase,
            dependencias
        );

        const rutaIndex = path.join(
            tempDir,
            'index.xhtml'
        );

        expect(fs.existsSync(rutaIndex)).toBe(true);

        expect(
            fs.readFileSync(rutaIndex, 'utf8')
        ).toBe(resultado.xhtml);
    });

    test('8. Conserva la cobertura CSS de las clases semánticas', async () => {
        const resultado = await compilarLexmotor(
            astBase,
            dependencias
        );

        const diagnostico = validateCSSCoverage(
            resultado.xhtml,
            cssBase
        );

        expect(diagnostico.valid).toBe(true);
        expect(diagnostico.missingClasses).toEqual([]);

        expect(diagnostico.usedClasses).toEqual([
            'body-base',
            'glosario'
        ]);
    });

    test('9. Dos compilaciones consecutivas producen el mismo XHTML', async () => {
        const resultado1 = await compilarLexmotor(
            astBase,
            dependencias
        );

        const resultado2 = await compilarLexmotor(
            astBase,
            dependencias
        );

        expect(resultado2.xhtml).toBe(resultado1.xhtml);
    });

    test('10. Dos compilaciones consecutivas producen AST enriquecidos equivalentes', async () => {
        const resultado1 = await compilarLexmotor(
            astBase,
            dependencias
        );

        const resultado2 = await compilarLexmotor(
            astBase,
            dependencias
        );

        expect(resultado2.astEnriquecido)
            .toEqual(resultado1.astEnriquecido);
    });
});