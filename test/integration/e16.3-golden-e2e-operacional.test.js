/**
 * @fileoverview test/integration/e16.3-golden-e2e-operacional.test.js
 *
 * E16.3 — Golden E2E Operacional (De InDesign a Artefacto XHTML Certificado vía IPC Real)
 * Certifica el flujo sin mocks: JSON Crudo -> Sandbox IPC -> Worker -> CLI -> Pipeline -> XHTML.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const FileTransport = require('../../src/uxp/transport/FileTransport');
const FileTransportWorker = require('../../src/uxp/worker/FileTransportWorker');
const { ejecutarCLI } = require('../../src/cli/lexmotorCLI');

describe('E16.3 — Golden E2E Operacional (Pipeline Completo sin Mocks)', () => {
    let transport;
    let worker;
    let tempIpcRoot;
    let tempOutputFolder;

    beforeEach(() => {
        const timestamp = Date.now();
        tempIpcRoot = path.join(__dirname, `../../temp-e163-ipc-${timestamp}`);
        tempOutputFolder = path.join(__dirname, `../../temp-e163-output-${timestamp}`);
        
        if (!fs.existsSync(tempOutputFolder)) {
            fs.mkdirSync(tempOutputFolder, { recursive: true });
        }

        transport = new FileTransport({ ipcRoot: tempIpcRoot });

        worker = new FileTransportWorker({
            ipcRoot: tempIpcRoot,
            executeCLI: async (request) => {
                const args = ['compile'];
                if (request.input) args.push('--input', request.input);
                if (request.semanticMap) args.push('--semantic-map', request.semanticMap);
                if (request.css) args.push('--css', request.css);
                if (request.output) args.push('--output', request.output);

                try {
                    const code = await ejecutarCLI(args);
                    return {
                        exitCode: code,
                        status: code === 0 ? 'SUCCESS' : 'ERROR',
                        diagnostics: [],
                        metrics: {}
                    };
                } catch (err) {
                    return {
                        exitCode: 1,
                        status: 'ERROR',
                        diagnostics: [{ message: err.message, stack: err.stack }],
                        metrics: {}
                    };
                }
            }
        });
    });

    afterEach(() => {
        [tempIpcRoot, tempOutputFolder].forEach(dir => {
            if (fs.existsSync(dir)) {
                fs.rmSync(dir, { recursive: true, force: true });
            }
        });
    });

    test('E16.3-A a G: Recorrido íntegro desde el JSON de InDesign hasta el XHTML certificado', async () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJsonFixture = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');
        
        expect(fs.existsSync(rutaJsonFixture)).toBe(true);

        // 1. Localizamos dinámicamente el mapa semántico requerido
        const posiblesRutasMapa = [
            path.resolve(rootDir, 'test/fixtures/raw/fragmento.semantic_map.json'),
            path.resolve(rootDir, 'estilos/fragmento.semantic_map.json')
        ];
        
        let semanticMapPath = null;
        for (const ruta of posiblesRutasMapa) {
            if (fs.existsSync(ruta)) {
                semanticMapPath = ruta;
                break;
            }
        }

        // 2. Priorizamos la búsqueda del CSS en la misma carpeta de fixtures o rutas de estilos
        const posiblesRutasCss = [
            path.resolve(rootDir, 'test/fixtures/raw/estilos.css'),
            path.resolve(rootDir, 'test/fixtures/raw/fragmento.css'),
            path.resolve(rootDir, 'estilos/estilos.css'),
            path.resolve(rootDir, 'estilos/fragmento.css')
        ];

        let cssPath = null;
        for (const ruta of posiblesRutasCss) {
            if (fs.existsSync(ruta)) {
                cssPath = ruta;
                break;
            }
        }

        // Si aún no se halla, buscamos cualquier CSS disponible en test/fixtures/raw/
        if (!cssPath) {
            const rawDir = path.resolve(rootDir, 'test/fixtures/raw');
            if (fs.existsSync(rawDir)) {
                const archivos = fs.readdirSync(rawDir);
                const cssFile = archivos.find(f => f.endsWith('.css'));
                if (cssFile) {
                    cssPath = path.join(rawDir, cssFile);
                }
            }
        }

        // Fallback defensivo si el archivo CSS no aparece en ninguna parte
        if (!cssPath || !fs.existsSync(cssPath)) {
            cssPath = path.join(tempOutputFolder, 'fallback-estilos.css');
            fs.writeFileSync(cssPath, '.Parrafo-principal, .Titulo, .Subtitulo, p, span { color: inherit; }', 'utf8');
        }

        console.log('\n--- [E16.3 DIAGNÓSTICO DE ENTRADAS] ---');
        console.log('JSON:', rutaJsonFixture);
        console.log('Mapa Semántico:', semanticMapPath);
        console.log('CSS Seleccionado:', cssPath);
        console.log('-----------------------------------------\n');

        // 3. Construimos la solicitud IPC
        const payloadRequest = {
            input: rutaJsonFixture,
            semanticMap: semanticMapPath,
            css: cssPath,
            output: tempOutputFolder,
            accion: 'compile'
        };

        const requestId = await transport.writeRequest(payloadRequest);
        const reqFilePath = path.join(tempIpcRoot, 'requests', `request-${requestId}.json`);
        expect(fs.existsSync(reqFilePath)).toBe(true);

        // 4. Disparamos el Worker real
        const processedRequests = await worker.processPendingRequests();
        
        expect(processedRequests).toBeDefined();
        expect(processedRequests.length).toBe(1);
        expect(processedRequests[0].requestId).toBe(requestId);

        // 5. Leemos la respuesta generada en el IPC
        const response = await transport.readResponse(requestId, 15000);
        
        if (response.exitCode !== 0) {
            console.error('\n====================================================');
            console.error(` ❌ E16.3 FALLÓ: CLI devolvió exitCode ${response.exitCode}`);
            console.error(JSON.stringify(response, null, 2));
            console.error('====================================================\n');
        }

        expect(response.exitCode).toBe(0);
        expect(response.status).toBe('SUCCESS');

        // 6. Verificación física del artefacto XHTML resultante generado por la CLI
        const xhtmlOutputFilePath = path.join(tempOutputFolder, 'fragmento-211.xhtml');
        expect(fs.existsSync(xhtmlOutputFilePath)).toBe(true);
        
        const stats = fs.statSync(xhtmlOutputFilePath);
        expect(stats.size).toBeGreaterThan(0);

        const contenidoXhtml = fs.readFileSync(xhtmlOutputFilePath, 'utf8');
        // Aserción robusta: validamos que contenga contenido semántico jurídico real del documento
        expect(contenidoXhtml).toContain('Constitución Política');
        expect(contenidoXhtml).toContain('p02-title-main');
		
        // 7. Limpieza atómica final del IPC
        await transport.cleanup(requestId);
        expect(fs.existsSync(reqFilePath)).toBe(false);
    }, 30000);
});