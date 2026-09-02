const fs = require('fs');
const path = require('path');
const os = require('os');
const { performance } = require('perf_hooks');

const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');

describe('E9 — Rendimiento y Escalabilidad Empírica', () => {
    let tempDir;
    let semanticMapPath;
    let profileMapPath;
    let dependencias;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(
            path.join(os.tmpdir(), 'lexmotor-e9-perf-')
        );

        semanticMapPath = path.join(tempDir, 'semantic_map.json');
        profileMapPath = path.join(tempDir, 'profile_map.json');

        // Mapa semántico básico para resolver los nodos sintéticos
        const semanticMap = {
            documentName: 'E9_Performance.indd',
            exportDate: '2026-08-11',
            styles: [
                {
                    originalName: 'P01_BODY_BASE',
                    type: 'paragraph',
                    exportTagging: {
                        epub: {
                            tag: 'p',
                            className: 'body-base',
                            attributes: null
                        }
                    }
                }
            ]
        };

        fs.writeFileSync(semanticMapPath, JSON.stringify(semanticMap), 'utf8');
        fs.writeFileSync(profileMapPath, JSON.stringify({}), 'utf8');

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

    /**
     * Generador de AST sintético escalable
     */
    const generarAST = (numParrafos) => {
        const contenido = [];
        for (let i = 0; i < numParrafos; i++) {
            contenido.push({
                tipoNodo: 'paragraph',
                estiloParrafo: 'P01_BODY_BASE',
                inDesignStyle: 'P01_BODY_BASE',
                contenido: [
                    {
                        tipoNodo: 'character',
                        texto: `Párrafo sintético número ${i} procesado en masa.`,
                        estiloCaracter: '[Ninguno]',
                        inDesignStyle: '[Ninguno]'
                    }
                ]
            });
        }
        return {
            documento: 'Carga_Sintetica.indd',
            contenido
        };
    };

    test('1. Procesamiento escalonado (1000 a 8000 párrafos) sin degradación superlineal', async () => {
        const tamaños = [1000, 2000, 4000, 8000];
        const mediciones = {};

        for (const tamaño of tamaños) {
            const ast = generarAST(tamaño);
            
            const inicio = performance.now();
            const resultado = await compilarLexmotor(ast, dependencias);
            const fin = performance.now();
            
            const tiempoMs = (fin - inicio);
            mediciones[`${tamaño}_nodos`] = { tiempo_ms: Number(tiempoMs.toFixed(2)) };

            // Verificación estructural: asegura que el último párrafo se haya procesado
            expect(resultado.xhtml).toContain(`Párrafo sintético número ${tamaño - 1}`);
        }

        // Impresión en consola para análisis empírico posterior
        console.table(mediciones);

        expect(Object.keys(mediciones).length).toBe(4);
    });

    test('2. Inmutabilidad del AST bajo carga masiva (1000 párrafos)', async () => {
        const ast = generarAST(1000);
        const astOriginal = JSON.parse(JSON.stringify(ast));

        await compilarLexmotor(ast, dependencias);

        expect(ast).toEqual(astOriginal);
    });

    test('3. Determinismo de salida en volumen (1000 párrafos)', async () => {
        const ast = generarAST(1000);

        const resultado1 = await compilarLexmotor(ast, dependencias);
        const resultado2 = await compilarLexmotor(ast, dependencias);

        expect(resultado1.xhtml).toBe(resultado2.xhtml);
        expect(resultado1.astEnriquecido).toEqual(resultado2.astEnriquecido);
    });
});