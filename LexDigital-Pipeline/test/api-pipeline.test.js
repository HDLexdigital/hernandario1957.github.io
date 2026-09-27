/**
 * @fileoverview test/api-pipeline.test.js
 * Pruebas de integración HTTP y pipeline editorial.
 */
const { app, iniciarServidor } = require('../server');

describe('API REST LexDigital Pipeline', () => {
    let server;
    const testPort = 9005;
    const baseUrl = `http://127.0.0.1:${testPort}`;

    beforeAll(async () => {
        server = await iniciarServidor(testPort, '127.0.0.1', false);
    });

    afterAll((done) => {
        if (server) {
            server.close(done);
        } else {
            done();
        }
    });

    test('GET /api/status retorna estado online y versión', async () => {
        const res = await fetch(`${baseUrl}/api/status`);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.status).toBe('online');
        expect(data.service).toBe('LexDigital Pipeline');
        expect(data.version).toBe('2.0.0');
    });

    test('GET /index.html sirve la interfaz web de control', async () => {
        const res = await fetch(`${baseUrl}/index.html`);
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain('LexDigitalHD - Panel de Control');
    });

    test('POST /api/pipeline/procesar-json compila documento a XHTML', async () => {
        const payload = {
            datos: {
                documento: { titulo: 'Norma de Integración' },
                contenido: [
                    { tipo: 'P02_TITLE_MAIN', texto: 'RESOLUCIÓN 500' },
                    { tipo: 'P01_BODY_BASE', texto: 'Artículo 1. Objeto de prueba de la API.' }
                ]
            },
            outputFormat: 'xhtml'
        };

        const res = await fetch(`${baseUrl}/api/pipeline/procesar-json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.formato).toBe('xhtml');
        expect(data.archivoSalida).toContain('Norma_de_Integraci_n.xhtml');
    });

    test('POST /api/pipeline/procesar-json rechaza peticiones sin datos válidos', async () => {
        const res = await fetch(`${baseUrl}/api/pipeline/procesar-json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
    });

    test('GET /health retorna OK y metadatos del servicio', async () => {
        const res = await fetch(`${baseUrl}/health`);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.status).toBe('OK');
        expect(data.service).toBe('lexdigital-pipeline');
    });

    test('GET /modular retorna lista de módulos', async () => {
        const res = await fetch(`${baseUrl}/modular`);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.status).toBe('OK');
        expect(Array.isArray(data.modulos)).toBe(true);
        expect(data.modulos).toContain('pipeline');
    });

    test('OPTIONS retorna cabeceras CORS universales', async () => {
        const res = await fetch(`${baseUrl}/health`, {
            method: 'OPTIONS'
        });
        expect(res.status).toBe(204);
        expect(res.headers.get('access-control-allow-origin')).toBe('*');
    });

    test('POST /build procesa payload editorial y retorna 202 con txId y runId', async () => {
        const res = await fetch(`${baseUrl}/build`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                source: 'web-ui',
                datos: {
                    documento: { titulo: 'Decreto_Prueba_Orquestador' },
                    contenido: [
                        { tipo: 'P01_BODY_BASE', texto: 'Texto de prueba orquestador' }
                    ]
                }
            })
        });

        expect(res.status).toBe(202);
        const data = await res.json();
        expect(data.status).toBe('OK');
        expect(data.txId).toMatch(/^tx-/);
        expect(data.runId).toMatch(/^run-/);
    });

    test('POST /render compila y devuelve XHTML plano directamente', async () => {
        const res = await fetch(`${baseUrl}/render`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                titulo: 'Norma_Render_Directo',
                contenido: [
                    { tipo: 'P01_BODY_BASE', texto: 'Párrafo para renderizado directo.' }
                ]
            })
        });

        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toContain('text/html');
        const xhtml = await res.text();
        expect(xhtml).toContain('xmlns="http://www.w3.org/1999/xhtml"');
        expect(xhtml).toContain('Párrafo para renderizado directo.');
    });

    test('POST /api/ingest acepta y compila contrato de extracción UXP InDesign', async () => {
        const uxpPayload = {
            contractVersion: '1.1.0',
            metadata: {
                source: 'Adobe InDesign UXP Plugin',
                documentName: 'Decreto_Extraido_UXP'
            },
            document: {
                nodes: [
                    {
                        id: 'story-0-p-0',
                        type: 'text_node',
                        content: 'DECRETO NÚMERO 100 DE 2026\r',
                        attributes: { styleName: 'P02_TITLE_MAIN' }
                    },
                    {
                        id: 'story-0-p-1',
                        type: 'text_node',
                        content: 'Artículo 1. Objeto y ámbito de aplicación del decreto.\r',
                        attributes: { styleName: 'P01_BODY_BASE' }
                    }
                ]
            }
        };

        const res = await fetch(`${baseUrl}/api/ingest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(uxpPayload)
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.message).toContain('Evidencia aceptada');
        expect(data.evidenceId).toBeDefined();
        expect(data.archivoSalida).toContain('Decreto_Extraido_UXP_UXP.xhtml');
    });
});

