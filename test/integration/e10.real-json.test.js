const fs = require('fs');
const path = require('path');
const os = require('os');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');
const { validateCSSCoverage } = require('../../src/validadores/validarCSSCoverage');

describe('E10.2 — Pipeline Completo: InDesignAdapter -> Lexmotor -> CSS', () => {
    let jsonReal;
    let jsonOriginal;
    let semanticMapReal;
    let cssReal;
    let tempDir;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'e10-real-'));

        // Artefacto real: Sin "tipoNodo" y usando "estilo", "texto" en párrafo y "fragmentos"
        jsonReal = {
            "documento": "fragmento.indd",
            "contenido": [
                {
                    "estilo": "P01_BODY_CONT",
                    "texto": "El pueblo de Colombia, en ejercicio de su soberanía...",
                    "fragmentos": [
                        {
                            "texto": "soberanía",
                            "estiloCaracter": "TerminoGlosario"
                        },
                        {
                            "texto": " es inalienable.",
                            "estiloCaracter": "[Ninguno]"
                        }
                    ]
                }
            ]
        };

        jsonOriginal = JSON.parse(JSON.stringify(jsonReal));

        semanticMapReal = {
            "styles": [
                {
                    "originalName": "P01_BODY_CONT",
                    "type": "paragraph",
                    "exportTagging": { "epub": { "tag": "p", "className": "p01-body-cont" } }
                },
                {
                    "originalName": "TerminoGlosario",
                    "type": "character",
                    "exportTagging": { "epub": { "tag": "span", "className": "glosario" } }
                },
                {
                    "originalName": "[Ninguno]",
                    "type": "character",
                    "exportTagging": { "epub": { "tag": null, "className": null } }
                }
            ]
        };

        cssReal = `
            .p01-body-cont { font-family: "Liberation Serif"; font-size: 14pt; }
            .glosario { font-weight: bold; }
        `;
    });

    afterEach(() => {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    test('1. Inmutabilidad profunda: El JSON original no es alterado', () => {
        adaptarInDesign({ jsonCrudo: jsonReal, semanticMap: semanticMapReal });
        expect(jsonReal).toEqual(jsonOriginal);
    });

    test('2. Inferencia y normalización sin trampas (E10.1)', () => {
        const resultado = adaptarInDesign({ jsonCrudo: jsonReal, semanticMap: semanticMapReal });
        const parrafo = resultado.ast.contenido[0];
        
        expect(parrafo.tipoNodo).toBe('paragraph');
        expect(parrafo.estiloParrafo).toBe('P01_BODY_CONT');
        expect(parrafo.texto).toBeUndefined(); // Verifica purga de texto redundante
        expect(parrafo.fragmentos).toBeUndefined();
    });

    test('3. Pipeline completo (E10 -> Lexmotor -> E6 -> E7)', async () => {
        const adaptacion = adaptarInDesign({ jsonCrudo: jsonReal, semanticMap: semanticMapReal });
        
        const mapPath = path.join(tempDir, 'semantic_map.json');
        fs.writeFileSync(mapPath, JSON.stringify(adaptacion.semanticMap));

        const dependencias = {
            outputFolder: tempDir,
            semanticMapPath: mapPath,
            profileStyleMapPath: path.join(tempDir, 'profile_map.json') // Evita fallos de lectura
        };
        fs.writeFileSync(dependencias.profileStyleMapPath, '{}');

        const resultadoLexmotor = await compilarLexmotor(adaptacion.ast, dependencias);

        // Verificaciones de contratos E4-E6
        expect(resultadoLexmotor.xhtml).toContain('class="p01-body-cont"');
        expect(resultadoLexmotor.xhtml).toContain('class="glosario"');
        expect(resultadoLexmotor.xhtml).toContain('soberanía');

        // Verificación E7 (Cobertura CSS)
        const diagnosticoCSS = validateCSSCoverage(resultadoLexmotor.xhtml, cssReal);
        expect(diagnosticoCSS.valid).toBe(true);
        expect(diagnosticoCSS.missingClasses.length).toBe(0);
    });
});