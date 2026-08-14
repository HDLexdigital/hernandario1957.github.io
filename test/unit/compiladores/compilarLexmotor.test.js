const fs = require('fs');
const path = require('path');
const os = require('os');
const { compilarLexmotor } = require('../../../src/compiladores/compilarLexmotor');
const { constructorXHTML } = require('../../../src/constructores/constructorXHTML');
const SemanticResolver = require('../../../src/adaptadores/SemanticResolver');

jest.mock('../../../src/constructores/constructorXHTML', () => ({
    constructorXHTML: jest.fn(() => '<xhtml>Documento Generado</xhtml>')
}));

// Espiamos directamente sobre el objeto SemanticResolver antes de las pruebas
jest.spyOn(SemanticResolver, 'indexSemanticMap');

describe('Fase E3: Integración de compilarLexmotor', () => {
    let tmpDir;
    let astOriginal;
    let rutasDependencias;

    beforeAll(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lexmotor-test-'));
        
        rutasDependencias = {
            semanticMapPath: path.join(tmpDir, 'semantic_map.json'),
            profileStyleMapPath: path.join(tmpDir, 'profile_map.json'),
            outputFolder: path.join(tmpDir, 'salidaXHTML')
        };

        const semanticMapD1 = {
            documentName: "fragmento.indd",
            exportDate: "test",
            styles: [
                {
                    id: "1",
                    originalName: "P01_BODY_BASE",
                    styleGroup: "",
                    type: "paragraph",
                    exportTagging: {
                        epub: { tag: "p", className: "body-base", attributes: null },
                        pdf: { tag: null, className: null, attributes: null }
                    }
                },
                {
                    id: "2",
                    originalName: "TerminoGlosario",
                    styleGroup: "",
                    type: "character",
                    exportTagging: {
                        epub: { tag: "span", className: "glosario", attributes: null },
                        pdf: { tag: null, className: null, attributes: null }
                    }
                }
            ]
        };
        fs.writeFileSync(rutasDependencias.semanticMapPath, JSON.stringify(semanticMapD1));

        fs.writeFileSync(rutasDependencias.profileStyleMapPath, JSON.stringify({
            "P01_BODY_BASE": { "tag": "p", "class": "perfil-body-base" }
        }));
    });

    beforeEach(() => {
        jest.clearAllMocks();
        
        astOriginal = {
            documento: "fragmento.indd",
            contenido: [
                {
                    tipoNodo: "paragraph",
                    estiloParrafo: "P01_BODY_BASE",
                    inDesignStyle: "P01_BODY_BASE",
                    contenido: [
                        { tipoNodo: "character", texto: "Artículo 3. La ", estiloCaracter: "[Ninguno]", inDesignStyle: "[Ninguno]" },
                        { tipoNodo: "character", texto: "soberanía", estiloCaracter: "TerminoGlosario", inDesignStyle: "TerminoGlosario" },
                        { tipoNodo: "character", texto: " reside.", estiloCaracter: "[Ninguno]", inDesignStyle: "[Ninguno]" }
                    ]
                },
                {
                    tipoNodo: "paragraph",
                    estiloParrafo: "P02_UNMAPPED",
                    inDesignStyle: "P02_UNMAPPED",
                    contenido: [
                        { tipoNodo: "character", texto: "Texto", estiloCaracter: "CharUnmapped", inDesignStyle: "CharUnmapped" }
                    ]
                }
            ]
        };
    });

    afterAll(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    describe('A. Entrada y aislamiento', () => {
        test('1. No muta astOriginal', async () => {
            const astAntes = JSON.parse(JSON.stringify(astOriginal));
            await compilarLexmotor(astOriginal, rutasDependencias);
            expect(astOriginal).toEqual(astAntes);
        });

        test('2. Acepta semanticMapPath = null', async () => {
            const deps = { ...rutasDependencias, semanticMapPath: null };
            const resultado = await compilarLexmotor(astOriginal, deps);
            expect(resultado.xhtml).toBe('<xhtml>Documento Generado</xhtml>');
        });

        test('3. Acepta profileStyleMapPath = null', async () => {
            const deps = { ...rutasDependencias, profileStyleMapPath: null };
            const resultado = await compilarLexmotor(astOriginal, deps);
            expect(resultado.xhtml).toBe('<xhtml>Documento Generado</xhtml>');
        });
    });

    describe('B. Resolución semántica', () => {
        test('4. Llama a indexSemanticMap una sola vez', async () => {
            await compilarLexmotor(astOriginal, rutasDependencias);
            expect(SemanticResolver.indexSemanticMap).toHaveBeenCalledTimes(1);
        });

        test('5. Profile > InDesign', async () => {
            const resultado = await compilarLexmotor(astOriginal, rutasDependencias);
            expect(resultado.astEnriquecido.contenido[0].resolvedClass).toBe('perfil-body-base');
        });

        test('6. InDesign > fallback', async () => {
            const deps = { ...rutasDependencias, profileStyleMapPath: null };
            const resultado = await compilarLexmotor(astOriginal, deps);
            expect(resultado.astEnriquecido.contenido[0].resolvedClass).toBe('body-base');
        });

        test('7. Fallback de paragraph', async () => {
            const deps = { ...rutasDependencias, profileStyleMapPath: null };
            const resultado = await compilarLexmotor(astOriginal, deps);
            const claseResuelta = resultado.astEnriquecido.contenido[1].resolvedClass;
            expect(['p02_unmapped', 'p02-unmapped']).toContain(claseResuelta);
        });

        test('8. Fallback de character', async () => {
            const deps = { ...rutasDependencias, profileStyleMapPath: null };
            const resultado = await compilarLexmotor(astOriginal, deps);
            expect(resultado.astEnriquecido.contenido[1].contenido[0].resolvedClass).toBe('charunmapped');
        });

        test('9. [Ninguno] no genera span', async () => {
            const resultado = await compilarLexmotor(astOriginal, rutasDependencias);
            expect(resultado.astEnriquecido.contenido[0].contenido[0].resolvedTag).toBeNull();
        });

        test('10. Conserva inDesignStyle', async () => {
            const resultado = await compilarLexmotor(astOriginal, rutasDependencias);
            expect(resultado.astEnriquecido.contenido[0].inDesignStyle).toBe('P01_BODY_BASE');
        });

        test('11. Resuelve múltiples character runs', async () => {
            const resultado = await compilarLexmotor(astOriginal, rutasDependencias);
            const runs = resultado.astEnriquecido.contenido[0].contenido;
            expect(runs[0].resolvedTag).toBeNull();
            expect(runs[1].resolvedTag).toBe('span');
        });
    });

    describe('C. Delegación XHTML', () => {
        test('12. Llama constructorXHTML', async () => {
            await compilarLexmotor(astOriginal, rutasDependencias);
            expect(constructorXHTML).toHaveBeenCalledTimes(1);
        });

        test('13. Entrega AST enriquecido', async () => {
            const resultado = await compilarLexmotor(astOriginal, rutasDependencias);
            expect(constructorXHTML).toHaveBeenCalledWith(resultado.astEnriquecido);
        });

        test('14. Devuelve XHTML', async () => {
            const resultado = await compilarLexmotor(astOriginal, rutasDependencias);
            expect(resultado.xhtml).toBe('<xhtml>Documento Generado</xhtml>');
        });
    });

    describe('D. Persistencia', () => {
        test('15. Crea outputFolder/index.xhtml', async () => {
            const mockCwd = jest.spyOn(process, 'cwd').mockReturnValue(tmpDir);
            const deps = { semanticMapPath: rutasDependencias.semanticMapPath, profileStyleMapPath: rutasDependencias.profileStyleMapPath };
            const resultado = await compilarLexmotor(astOriginal, deps);
            const archivoGuardado = path.join(tmpDir, 'salidaXHTML', 'index.xhtml');
            
            expect(fs.existsSync(archivoGuardado)).toBe(true);
            mockCwd.mockRestore();
        });
    });
});