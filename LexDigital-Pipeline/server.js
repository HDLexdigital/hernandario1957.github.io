'use strict';

const http = require('http');
const express = require('express');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const chokidar = require('chokidar');
const os = require('os');

const {
    compilarLexmotor,
    validarCompatibilidad,
    PipelineError,
    ValidationError
} = require('../index');

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
console.log('             LEXDIGITAL PIPELINE');
console.log('============================================================');
console.log('');
console.log(`Interfaz Web: http://${HOST}:${PORT}`);
console.log(`HTTP Endpoint: http://${HOST}:${PORT}/api/pipeline/procesar-json`);
console.log(`WebSocket:     ws://${HOST}:${PORT}`);
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
                        'El campo "jsonCrudo" is obligatorio.'
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
        const { datos, outputFormat = 'pdf' } = req.body;
        const datosInDesign = datos || req.body;

        if (!datosInDesign || Object.keys(datosInDesign).length === 0) {
            return res.status(400).json({ success: false, error: "El JSON recibido está vacío o es inválido." });
        }

        console.log('');
        console.log('------------------------------------------------------------');
        console.log(`Solicitud POST /api/pipeline/procesar-json [Formato: ${outputFormat.toUpperCase()}]`);
        console.log('------------------------------------------------------------');

        const jsonNormalizado = jsonEditorialAdapter(datosInDesign);

        const directorioSalida = path.join(__dirname, 'salidas');
        if (!fs.existsSync(directorioSalida)) {
            fs.mkdirSync(directorioSalida, { recursive: true });
        }

        let nombreArchivoSalida = '';

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
 * ENDPOINT IPC (FILESYSTEM WATCHER PARA UXP / INDESIGN - E17.4 DINÁMICO)
 * =====================================================================
 */
function inicializarSubsistemaIPC() {
    try {
        const homeDir = os.homedir();
        const rendezvousPath = path.join(homeDir, '.lexdigital', 'active-ipc-root.json');

        if (!fs.existsSync(rendezvousPath)) {
            console.warn(`[E17.4 WARN] No se encontró el archivo de rendezvous en: ${rendezvousPath}. El transporte IPC permanecerá inactivo hasta que UXP emita su latido.`);
            return null;
        }

        const rendezvousContent = fs.readFileSync(rendezvousPath, 'utf-8');
        const rendezvous = JSON.parse(rendezvousContent);
        
        if (!rendezvous || !rendezvous.ipcRoot) {
            console.warn(`[E17.4 WARN] El rendezvous no contiene una propiedad ipcRoot válida.`);
            return null;
        }

        const ipcRootPath = rendezvous.ipcRoot;
        const rootStat = fs.existsSync(ipcRootPath) ? fs.statSync(ipcRootPath) : null;
        if (!rootStat || !rootStat.isDirectory()) {
            console.warn(`[E17.4 WARN] El ipcRoot especificado no existe o no es un directorio válido: ${ipcRootPath}`);
            return null;
        }

        const requestsDir = path.join(ipcRootPath, 'requests');
        const responsesDir = path.join(ipcRootPath, 'responses');
        const payloadsDir = path.join(ipcRootPath, 'payloads');

        [requestsDir, responsesDir, payloadsDir].forEach(dir => {
            if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
                throw new Error(`[E17.4 FATAL] La subcarpeta requerida no es un directorio válido: ${dir}`);
            }
        });

        console.log(`[E17.4] Rendezvous validado correctamente. ipcRoot activo: ${ipcRootPath}`);
        return { requestsDir, responsesDir, payloadsDir };

    } catch (e) {
        console.error(`[E17.4 ERROR] Fallo al inicializar el subsistema IPC: ${e.message}`);
        return null;
    }
}

const ipcCarpetas = inicializarSubsistemaIPC();

if (ipcCarpetas) {
    const { requestsDir, responsesDir, payloadsDir } = ipcCarpetas;

    console.log('Iniciando Watcher IPC dinámico para InDesign (UXP)...');
    console.log(`Vigilando requests en: ${requestsDir}`);

    const watcher = chokidar.watch(requestsDir, {
        ignored: /(^|[\/\\])\../,
        persistent: true,
        awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 100 }
    });

    watcher.on('add', async (filePath) => {
        const fileName = path.basename(filePath);
        
        if (!fileName.startsWith('request-req-uxp-') || !fileName.endsWith('.json')) return;

        const requestId = fileName.replace('request-', '').replace('.json', '');
        console.log(`\n[IPC] REQUEST_RECEIVED id=${requestId}`);
        console.log(`Archivo: ${fileName}`);

        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const payload = JSON.parse(fileContent);
            console.log(`[IPC] PAYLOAD_PARSED`);
            console.log(`Comando: ${payload.command}`);

			const inputData = JSON.parse(fs.readFileSync(payload.input, 'utf-8'));
			console.log("[DEBUG INPUT DATA DESDE UXP]:", JSON.stringify(inputData, null, 2));
            const semanticMap = payload.semanticMap ? JSON.parse(fs.readFileSync(payload.semanticMap, 'utf-8')) : null;
            
            console.log(`[IPC] COMPILATION_START`);
            
            const { adaptarInDesign } = require('../src/adaptadores/InDesignAdapter');
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

            // =================================================================
            // SALIDA JERÁRQUICA ORGANIZADA POR DOCUMENTO
            // =================================================================
            const rawName = payload.nombreBase || payload.documentName || payload.name || `documento_${requestId}`;
            const docNameClean = String(rawName).replace(/[^a-zA-Z0-9-_]/g, '_');
            
            const docOutputDir = path.join(__dirname, 'salidas', docNameClean);
            const xhtmlDir = path.join(docOutputDir, 'xhtml');
            const jsonDir = path.join(docOutputDir, 'json');
            const assetsDir = path.join(docOutputDir, 'assets');

            [docOutputDir, xhtmlDir, jsonDir, assetsDir].forEach(d => {
                if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
            });

            const xhtmlFilePath = path.join(xhtmlDir, `${docNameClean}.xhtml`);
            const jsonFilePath = path.join(jsonDir, `${docNameClean}.json`);

            fs.writeFileSync(xhtmlFilePath, resultado.xhtml, 'utf-8');
            fs.writeFileSync(jsonFilePath, JSON.stringify(resultado.jsonOficial, null, 2), 'utf-8');

            console.log(`[IPC] Artefactos escritos físicamente en: ${docOutputDir}`);
            // =================================================================

            // Escribir la respuesta para UXP
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
            
            fs.unlinkSync(filePath);

        } catch (error) {
            console.error(`[IPC] COMPILATION_ERROR id=${requestId}`);
            console.error(error.stack || error.message); // <-- Traza completa del error activada

            const errorResponsePath = path.join(responsesDir, `response-${requestId}.json`);
            const errorData = {
                success: false,
                requestId: requestId,
                error: error.message
            };
            fs.writeFileSync(errorResponsePath, JSON.stringify(errorData, null, 2), 'utf-8');
            try { fs.unlinkSync(filePath); } catch (e) {}
        }
    });
} else {
    console.log('[E17.4] Subsistema IPC omitido por ausencia de rendezvous válido. Los servicios HTTP y WebSocket continúan activos.');
}

/**
 * Iniciar servidor compartido unificado.
 */
servidorHttp.listen(PORT, HOST, () => {
    console.log('');
    console.log('============================================================');
    console.log('             LEXDIGITAL PIPELINE ACTIVO');
    console.log('============================================================');
    console.log(`Interfaz Web: http://${HOST}:${PORT}`);
    console.log(`HTTP Endpoint: http://${HOST}:${PORT}/api/pipeline/procesar-json`);
    console.log(`WebSocket:     ws://${HOST}:${PORT}`);
    console.log('============================================================');
    console.log('');
    console.log('Acciones WebSocket disponibles:');
    console.log('  ping');
    console.log('  validate');
    console.log('  compile');
    console.log('');
});