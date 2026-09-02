const fs = require('fs');
const path = require('path');
const os = require('os');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');

describe('E9 — Concurrencia y Aislamiento', () => {
    let tempDir;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lexmotor-e9-concurrency-'));
    });

    afterEach(() => {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    // Helper para generar contextos 100% aislados (mapa, AST y directorio de salida propio)
    const crearContextoAislado = (idContexto) => {
        const dir = path.join(tempDir, `ctx_${idContexto}`);
        fs.mkdirSync(dir);

        const mapPath = path.join(dir, 'semantic_map.json');
        const semanticMap = {
            styles: [
                {
                    originalName: 'Estilo_Base',
                    exportTagging: { 
                        epub: { tag: 'p', className: `clase-${idContexto}` } 
                    }
                }
            ]
        };
        fs.writeFileSync(mapPath, JSON.stringify(semanticMap));

        const ast = {
            documento: `Doc_${idContexto}.indd`,
            contenido: [
                {
                    tipoNodo: 'paragraph',
                    inDesignStyle: 'Estilo_Base',
                    contenido: [
                        { 
                            tipoNodo: 'character', 
                            texto: `Texto exclusivo del documento ${idContexto}`, 
                            estiloCaracter: '[Ninguno]' 
                        }
                    ]
                }
            ]
        };

        return {
            ast,
            dependencias: {
                semanticMapPath: mapPath,
                outputFolder: dir
            }
        };
    };

    test('1. Ejecución concurrente sin contaminación de estado cruzado (Promise.all)', async () => {
        const ctxA = crearContextoAislado('A');
        const ctxB = crearContextoAislado('B');
        const ctxC = crearContextoAislado('C');

        // Disparamos 3 compilaciones simultáneas en el event loop
        const [resultadoA, resultadoB, resultadoC] = await Promise.all([
            compilarLexmotor(ctxA.ast, ctxA.dependencias),
            compilarLexmotor(ctxB.ast, ctxB.dependencias),
            compilarLexmotor(ctxC.ast, ctxC.dependencias)
        ]);

        // Verificamos que A es puramente A
        expect(resultadoA.xhtml).toContain('class="clase-A"');
        expect(resultadoA.xhtml).toContain('documento A');
        expect(resultadoA.xhtml).not.toContain('clase-B');
        expect(resultadoA.xhtml).not.toContain('clase-C');

        // Verificamos que B es puramente B
        expect(resultadoB.xhtml).toContain('class="clase-B"');
        expect(resultadoB.xhtml).toContain('documento B');
        expect(resultadoB.xhtml).not.toContain('clase-A');
        
        // Verificamos que C es puramente C
        expect(resultadoC.xhtml).toContain('class="clase-C"');
        expect(resultadoC.xhtml).toContain('documento C');
        expect(resultadoC.xhtml).not.toContain('clase-A');
    });
});