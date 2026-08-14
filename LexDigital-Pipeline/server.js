'use strict';

const http = require('http');
const express = require('express');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const {
    compilarLexmotor,
    validarCompatibilidad,
    PipelineError,
    ValidationError
} = require('./index');

const { jsonEditorialAdapter } = require('./core/jsonEditorialAdapter');
const config = require('./config.json');

const HOST = config.host;
const PORT = config.port;

const app = express();

// 1. Servir archivos estáticos de la interfaz web (HTML/CSS/JS)
app.use(express.static(path.join(__dirname, 'public')));

// 2. Middlewares para payloads grandes de InDesign
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const servidorHttp = http.createServer(app);
const servidorWs = new WebSocket.Server({ server: servidorHttp });

console.log('');
console.log('============================================================');
console.log('              LEXDIGITAL PIPELINE');
console.log('============================================================');
console.log('');
console.log(`Interfaz Web: http://${HOST}:${PORT}`);
console.log(`HTTP Endpoint: http://${HOST}:${PORT}/api/pipeline/procesar-json`);
console.log(`WebSocket:    ws://${HOST}:${PORT}`);
console.log('');
console.log('Motor: LexDigital');
console.log('Estado: iniciado');
console.log('');

/**
 * Envía una respuesta JSON al cliente WebSocket.
 */
function enviar(socket, payload) {
    socket.send(
        JSON.stringify(payload)
    );
}

/**
 * Procesa una solicitud de compilación vía WebSocket.
 */
async function procesarCompilacion(socket, request) {
    const {
        jsonCrudo,
        nombreBase,
        nombreCSS,
        opciones = {}
    } = request;

    console.log('');
    console.log('------------------------------------------------------------');
    console.log('Solicitud COMPILE (WebSocket)');
    console.log('------------------------------------------------------------');
    console.log(`nombreBase : ${nombreBase}`);
    console.log(`nombreCSS  : ${nombreCSS}`);
    console.log('');

    const inicio = Date.now();

    const jsonNormalizado = jsonEditorialAdapter(jsonCrudo);

    const resultado = await compilarLexmotor(
        jsonNormalizado,
        nombreBase,
        nombreCSS,
        opciones
    );

    const tiempo = Date.now() - inicio;

    console.log('');
    console.log(`Compilación completada en ${tiempo} ms.`);
    console.log('');

    enviar(socket, {
        type: 'response',
        action: 'compile',
        success: true,
        result: resultado
    });
}

/**
 * Procesa las solicitudes recibidas por WebSocket.
 */
async function procesarMensaje(socket, data) {
    let request;

    try {
        request = JSON.parse(data.toString());
    } catch (error) {
        enviar(socket, {
            type: 'error',
            success: false,
            error: {
                type: 'InvalidJSON',
                message: 'La solicitud no contiene JSON válido.'
            }
        });
        return;
    }

    console.log('');
    console.log('Solicitud WebSocket recibida:');
    console.log(JSON.stringify(request, null, 2));

    try {
        switch (request.action) {
            case 'compile':
                await procesarCompilacion(socket, request);
                break;

            case 'ping':
                enviar(socket, {
                    type: 'response',
                    action: 'ping',
                    success: true,
                    result: {
                        message: 'LexDigital Pipeline activo',
                        timestamp: new Date().toISOString()
                    }
                });
                break;

            case 'validate':
                if (
                    !request.jsonCrudo ||
                    typeof request.jsonCrudo !== 'object'
                ) {
                    throw new ValidationError(
                        'El campo "jsonCrudo" es obligatorio.'
                    );
                }

                const jsonNormalizado = jsonEditorialAdapter(request.jsonCrudo);
                const validacion = validarCompatibilidad(jsonNormalizado);

                enviar(socket, {
                    type: 'response',
                    action: 'validate',
                    success: true,
                    result: validacion
                });
                break;

            default:
                enviar(socket, {
                    type: 'error',
                    success: false,
                    error: {
                        type: 'UnknownAction',
                        message: `Acción no soportada: ${request.action}`
                    }
                });
                break;
        }
    } catch (error) {
        console.error('');
        console.error('ERROR EN PIPELINE');
        console.error('Tipo:', error.name);
        console.error('Mensaje:', error.message);

        if (error.stack) {
            console.error(error.stack);
        }

        enviar(socket, {
            type: 'error',
            action: request.action || null,
            success: false,
            error: {
                type: error.name || 'Error',
                message: error.message || 'Error desconocido'
            }
        });
    }
}

/* 
 * =====================================================================
 * ENDPOINT HTTP POST MULTIFORMATO (PDF / XHTML / JSON)
 * =====================================================================
 */
app.post('/api/pipeline/procesar-json', async (req, res) => {
    try {
        // Soportamos tanto peticiones con { datos, outputFormat } como JSON directo
        const { datos, outputFormat = 'pdf' } = req.body;
        const datosInDesign = datos || req.body;

        if (!datosInDesign || Object.keys(datosInDesign).length === 0) {
            return res.status(400).json({ success: false, error: "El JSON recibido está vacío o es inválido." });
        }

        console.log('');
        console.log('------------------------------------------------------------');
        console.log(`Solicitud POST /api/pipeline/procesar-json [Formato: ${outputFormat.toUpperCase()}]`);
        console.log('------------------------------------------------------------');

        // 1. Normalizar estructura con el adaptador editorial
        const jsonNormalizado = jsonEditorialAdapter(datosInDesign);

        // 2. Directorio de salidas
        const directorioSalida = path.join(__dirname, 'salidas');
        if (!fs.existsSync(directorioSalida)) {
            fs.mkdirSync(directorioSalida, { recursive: true });
        }

        let nombreArchivoSalida = '';

        // 3. Generación según el formato de salida seleccionado
        if (outputFormat === 'json') {
            nombreArchivoSalida = `documento_${Date.now()}_corregido.json`;
            const rutaSalida = path.join(directorioSalida, nombreArchivoSalida);
            fs.writeFileSync(rutaSalida, JSON.stringify(jsonNormalizado, null, 2), 'utf8');
            console.log(`🎉 JSON normalizado generado con éxito en: ${rutaSalida}`);

        } else if (outputFormat === 'xhtml') {
            nombreArchivoSalida = `documento_${Date.now()}_procesado.xhtml`;
            const rutaSalida = path.join(directorioSalida, nombreArchivoSalida);
            
            const contenidoXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="es">
<head>
    <meta charset="UTF-8"/>
    <title>Documento LexDigital</title>
</head>
<body>
    <pre>${JSON.stringify(jsonNormalizado, null, 2)}</pre>
</body>
</html>`;

            fs.writeFileSync(rutaSalida, contenidoXhtml, 'utf8');
            console.log(`🎉 XHTML estructurado generado con éxito en: ${rutaSalida}`);

        } else {
            // Formato por defecto: PDF Accesible mediante Puppeteer
            nombreArchivoSalida = `documento_${Date.now()}.pdf`;
            const rutaSalida = path.join(directorioSalida, nombreArchivoSalida);

            const htmlContenido = `
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <style>
                        @page {
                            size: A4;
                            margin: 25mm 20mm;
                            @bottom-right {
                                content: counter(page);
                                font-size: 10pt;
                                font-family: sans-serif;
                                color: #666;
                            }
                        }
                        body {
                            font-family: "Georgia", serif;
                            font-size: 11pt;
                            line-height: 1.6;
                            color: #222;
                            margin: 0;
                            padding: 0;
                        }
                        h1 {
                            font-family: "Helvetica Neue", sans-serif;
                            font-size: 18pt;
                            color: #111;
                            border-bottom: 2px solid #0078d4;
                            padding-bottom: 6px;
                        }
                    </style>
                </head>
                <body>
                    <h1>Documento Compilado - LexDigital</h1>
                    <pre>${JSON.stringify(jsonNormalizado, null, 2)}</pre>
                </body>
                </html>
            `;

            console.log("🚀 Iniciando motor Puppeteer para renderizado PDF...");
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            await page.setContent(htmlContenido, { waitUntil: 'networkidle0' });

            await page.pdf({
                path: rutaSalida,
                format: 'A4',
                printBackground: true
            });

            await browser.close();
            console.log(`🎉 PDF accesible generado con éxito en: ${rutaSalida}`);
        }

        return res.status(200).json({
            success: true,
            mensaje: `Pipeline HTTP ejecutado y formato [${outputFormat.toUpperCase()}] compilado correctamente`,
            archivoSalida: nombreArchivoSalida
        });

    } catch (error) {
        console.error(`❌ Error en el endpoint HTTP: ${error.message}`);
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Nueva conexión WebSocket.
 */
servidorWs.on('connection', (socket, request) => {
    console.log('');
    console.log('============================================================');
    console.log('Cliente WebSocket conectado');
    console.log('============================================================');

    enviar(socket, {
        type: 'connection',
        success: true,
        server: 'LexDigital Pipeline',
        status: 'connected',
        timestamp: new Date().toISOString()
    });

    socket.on('message', async (data) => {
        await procesarMensaje(socket, data);
    });

    socket.on('close', () => {
        console.log('');
        console.log('Cliente WebSocket desconectado.');
        console.log('');
    });

    socket.on('error', (error) => {
        console.error('Error del socket:', error.message);
    });
});

/**
 * Errores del servidor HTTP/WS.
 */
servidorHttp.on('error', (error) => {
    console.error('');
    console.error('============================================================');
    console.error('ERROR DEL SERVIDOR');
    console.error('============================================================');
    console.error('');
    console.error(error);
});

/* 
 * =====================================================================
 * ENDPOINT IPC (FILESYSTEM WATCHER PARA UXP / INDESIGN)
 * =====================================================================
 */
const chokidar = require('chokidar');

// Ruta compartida con UXP (Ajusta la base si es necesario según donde esté tu carpeta UXP)
const ipcDir = path.join(__dirname, 'ipc');
const requestsDir = path.join(ipcDir, 'requests');
const responsesDir = path.join(ipcDir, 'responses');
const payloadsDir = path.join(ipcDir, 'payloads');

// Asegurar que las carpetas existen
[ipcDir, requestsDir, responsesDir, payloadsDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

console.log('Iniciando Watcher IPC para InDesign (UXP)...');
console.log(`Vigilando: ${requestsDir}`);

const watcher = chokidar.watch(requestsDir, {
    ignored: /(^|[\/\\])\../, // ignora archivos ocultos
    persistent: true,
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 100 }
});

watcher.on('add', async (filePath) => {
    const fileName = path.basename(filePath);
    
    // Solo procesar archivos de request de UXP
    if (!fileName.startsWith('request-req-uxp-') || !fileName.endsWith('.json')) return;

    const requestId = fileName.replace('request-', '').replace('.json', '');
    console.log(`\n[IPC] REQUEST_RECEIVED id=${requestId}`);
    console.log(`Archivo: ${fileName}`);

    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const payload = JSON.parse(fileContent);
        console.log(`[IPC] PAYLOAD_PARSED`);
        console.log(`Comando: ${payload.command}`);

        // Leer los recursos locales que InDesign depositó en "payloads"
        const inputData = JSON.parse(fs.readFileSync(payload.input, 'utf-8'));
        const semanticMap = payload.semanticMap ? JSON.parse(fs.readFileSync(payload.semanticMap, 'utf-8')) : null;
        
        console.log(`[IPC] COMPILATION_START`);
        
        // Fase 0: Adaptación E10 y Fase 1-4: Compilación
        const { adaptarInDesign } = require('./adaptadores/InDesignAdapter');
        let jsonNormalizado = inputData;
        
        if (inputData.tokens) {
             const adaptacion = adaptarInDesign({ jsonCrudo: inputData, semanticMap });
             jsonNormalizado = adaptacion.ast;
        }

        const resultado = await compilarLexmotor(
            jsonNormalizado,
            'InDesign_Export',
            payload.css || 'estilos.css'
        );

        console.log(`[IPC] COMPILATION_COMPLETE id=${requestId}`);

        // Escribir la respuesta
        console.log(`[IPC] RESPONSE_WRITE_START`);
        const responseData = {
            success: true,
            requestId: requestId,
            timestamp: new Date().toISOString(),
            result: resultado
        };

        const responsePath = path.join(responsesDir, `response-${requestId}.json`);
        fs.writeFileSync(responsePath, JSON.stringify(responseData, null, 2), 'utf-8');
        
        console.log(`[IPC] RESPONSE_WRITE_COMPLETE`);
        
        // Limpieza del request procesado (opcional, pero recomendado)
        fs.unlinkSync(filePath);

    } catch (error) {
        console.error(`[IPC] COMPILATION_ERROR id=${requestId}`);
        console.error(error.message);

        // Devolver respuesta de error a UXP para evitar que espere los 30 segundos
        const errorResponsePath = path.join(responsesDir, `response-${requestId}.json`);
        const errorData = {
            success: false,
            requestId: requestId,
            error: error.message
        };
        fs.writeFileSync(errorResponsePath, JSON.stringify(errorData, null, 2), 'utf-8');
        fs.unlinkSync(filePath); // Limpiar request fallido
    }
});

/**
 * Iniciar servidor compartido unificado.
 */
servidorHttp.listen(PORT, HOST, () => {
    console.log('');
    console.log('============================================================');
    console.log('              LEXDIGITAL PIPELINE ACTIVO');
    console.log('============================================================');
    console.log(`Interfaz Web: http://${HOST}:${PORT}`);
    console.log(`HTTP Endpoint: http://${HOST}:${PORT}/api/pipeline/procesar-json`);
    console.log(`WebSocket:    ws://${HOST}:${PORT}`);
    console.log('============================================================');
    console.log('');
    console.log('Acciones WebSocket disponibles:');
    console.log('  ping');
    console.log('  validate');
    console.log('  compile');
    console.log('');
});