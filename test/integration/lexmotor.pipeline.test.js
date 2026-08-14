const fs = require('fs');
const path = require('path');
const os = require('os');

const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');
const {
    validateCSSCoverage
} = require('../../src/validadores/validarCSSCoverage');

describe('Fase E8: Validación con Documento Real de Producción', () => {
    let tempDir;
    let semanticMapPath;
    let profileMapPath;
    let cssFilePath;
    let astRealProduccion;
    let cssRealProduccion;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(
            path.join(os.tmpdir(), 'lexmotor-e8-')
        );

        semanticMapPath = path.join(
            tempDir,
            'semantic_map.json'
        );

        profileMapPath = path.join(
            tempDir,
            'profile_map.json'
        );

        cssFilePath = path.join(
            tempDir,
            'styles_indesign.css'
        );

        /*
         * ============================================================
         * E1/E2 — MAPA SEMÁNTICO REAL
         * ============================================================
         */

        const semanticMap = {
            documentName: 'ConstitucionPolitica.indd',
            exportDate: '2026-06-11',
            styles: [
                {
                    id: '1',
                    originalName: 'ParrafoBase',
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

        /*
         * ============================================================
         * E3 — PERFIL
         * ============================================================
         *
         * Vacío intencionalmente para comprobar el fallback
         * al mapa semántico.
         */

        const profileMap = {};

        fs.writeFileSync(
            profileMapPath,
            JSON.stringify(profileMap, null, 2),
            'utf8'
        );

        /*
         * ============================================================
         * E7 — CSS EDITORIAL
         * ============================================================
         */

        cssRealProduccion = `
            body {
                font-family: 'Times New Roman', serif;
            }

            .body-base {
                font-size: 10pt;
                line-height: 1.2;
                text-align: justify;
            }

            .glosario {
                font-weight: bold;
                color: #003366;
            }
        `;

        fs.writeFileSync(
            cssFilePath,
            cssRealProduccion,
            'utf8'
        );

        /*
         * ============================================================
         * AST DE PRODUCCIÓN
         * ============================================================
         */

        astRealProduccion = {
            documento: 'ConstitucionPolitica.indd',

            contenido: [
                {
                    tipoNodo: 'paragraph',
                    estiloParrafo: 'ParrafoBase',

                    contenido: [
                        {
                            tipoNodo: 'character',

                            texto:
                                'Artículo 1. Colombia es un Estado social de derecho. ' +
                                'Las condiciones a < b & c > 0 aplican normativamente.',

                            estiloCaracter: '[Ninguno]'
                        }
                    ]
                }
            ]
        };
    });

    afterEach(() => {
        if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, {
                recursive: true,
                force: true
            });
        }
    });

    test(
        'E8. Ejecuta el pipeline completo y audita CSS con un documento de producción',
        async () => {

            /*
             * ========================================================
             * E1 → E6
             * ========================================================
             */

            const resultadoPipeline = await compilarLexmotor(
                astRealProduccion,
                {
                    semanticMapPath,
                    profileStyleMapPath: profileMapPath,
                    outputFolder: tempDir
                }
            );

            /*
             * --------------------------------------------------------
             * Contrato de retorno E3/E5
             * --------------------------------------------------------
             */

            expect(resultadoPipeline).toHaveProperty(
                'astEnriquecido'
            );

            expect(resultadoPipeline).toHaveProperty(
                'xhtml'
            );

            expect(resultadoPipeline).toHaveProperty(
                'directorioSalida'
            );

            expect(resultadoPipeline.directorioSalida)
                .toBe(tempDir);

            /*
             * ========================================================
             * E1/E2 — RESOLUCIÓN SEMÁNTICA
             * ========================================================
             */

            const parrafo =
                resultadoPipeline.astEnriquecido.contenido[0];

            expect(parrafo.resolvedTag)
                .toBe('p');

            expect(parrafo.resolvedClass)
                .toBe('body-base');

            /*
             * ========================================================
             * E3 — PRESERVACIÓN DEL ESTILO DE ORIGEN
             * ========================================================
             *
             * El estilo de InDesign debe permanecer disponible
             * después del enriquecimiento.
             */

            expect(parrafo.estiloParrafo)
                .toBe('ParrafoBase');

            /*
             * ========================================================
             * E4 — CHARACTER RUN [Ninguno]
             * ========================================================
             */

            const characterRun =
                parrafo.contenido[0];

            expect(characterRun.resolvedTag)
                .toBeNull();

            expect(characterRun.resolvedClass)
                .toBeUndefined();

            /*
             * ========================================================
             * E4/E6 — XHTML Y ESCAPE XML
             * ========================================================
             */

            expect(resultadoPipeline.xhtml)
                .toContain('<p class="body-base">');

            expect(resultadoPipeline.xhtml)
                .toContain('&lt;');

            expect(resultadoPipeline.xhtml)
                .toContain('&amp;');

            expect(resultadoPipeline.xhtml)
                .toContain('&gt;');

            /*
             * El texto original NO debe aparecer con los
             * operadores XML sin escapar.
             */

            expect(resultadoPipeline.xhtml)
                .not.toContain('a < b');

            expect(resultadoPipeline.xhtml)
                .not.toContain('b & c');

            expect(resultadoPipeline.xhtml)
                .not.toContain('c > 0');

            /*
             * ========================================================
             * E5 — PERSISTENCIA
             * ========================================================
             */

            const rutaIndex = path.join(
                tempDir,
                'index.xhtml'
            );

            expect(fs.existsSync(rutaIndex))
                .toBe(true);

            const contenidoGuardado =
                fs.readFileSync(
                    rutaIndex,
                    'utf8'
                );

            expect(contenidoGuardado)
                .toBe(resultadoPipeline.xhtml);

            /*
             * ========================================================
             * E7 — AUDITORÍA CSS
             * ========================================================
             *
             * E7 todavía es una auditoría independiente.
             * No se ejecuta dentro de compilarLexmotor.
             */

            const diagnosticoCSS =
                validateCSSCoverage(
                    resultadoPipeline.xhtml,
                    cssRealProduccion
                );

            expect(diagnosticoCSS)
                .toHaveProperty('valid');

            expect(diagnosticoCSS)
                .toHaveProperty('usedClasses');

            expect(diagnosticoCSS)
                .toHaveProperty('missingClasses');

            expect(diagnosticoCSS.valid)
                .toBe(true);

            expect(diagnosticoCSS.usedClasses)
                .toContain('body-base');

            expect(diagnosticoCSS.missingClasses)
                .toEqual([]);
        }
    );

    test(
        'E8. Detecta una ruptura real entre XHTML y CSS editorial',
        async () => {

            const resultadoPipeline =
                await compilarLexmotor(
                    astRealProduccion,
                    {
                        semanticMapPath,
                        profileStyleMapPath: profileMapPath,
                        outputFolder: tempDir
                    }
                );

            /*
             * CSS deliberadamente incompatible:
             * el XHTML utiliza .body-base pero el CSS no la define.
             */

            const cssRoto = `
                body {
                    font-family: 'Times New Roman', serif;
                }

                .parrafo-base {
                    font-size: 10pt;
                }
            `;

            const diagnostico =
                validateCSSCoverage(
                    resultadoPipeline.xhtml,
                    cssRoto
                );

            expect(diagnostico.valid)
                .toBe(false);

            expect(diagnostico.usedClasses)
                .toContain('body-base');

            expect(diagnostico.missingClasses)
                .toContain('body-base');
        }
    );
});