'use strict';
const http = require('http');
const express = require('express');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const config = require('./config.json');
const { compilarLexmotor } = require('./core/index');
const { jsonEditorialAdapter } = require('./core/jsonEditorialAdapter');
const { purgarCSSInDesign } = require('./core/utils/cssPurifier');

const HOST = process.env.HOST || config.host || '127.0.0.1';
const PORT = parseInt(process.env.PORT || config.port || 8765, 10);

// Rutas configurables
const PLUGIN_JSON = process.env.LEXMOTOR_PLUGIN_JSON || path.resolve(__dirname, 'ipc', 'documento_extraido.json');
const SALIDA_XHTML = process.env.LEXMOTOR_SALIDA_XHTML || path.resolve(__dirname, config.rutas?.xhtml || 'salidas/xhtml');
const SALIDA_JSON = process.env.LEXMOTOR_SALIDA_JSON || path.resolve(__dirname, config.rutas?.json || 'salidas/json');
const SALIDAS_DIR = process.env.LEXMOTOR_SALIDAS || path.resolve(__dirname, config.rutas?.salidas || 'salidas');
const CSS_CANONICO_PATH = process.env.LEXMOTOR_CSS || path.resolve(__dirname, 'core/assets/Lexdigital_Modular.css');

// Asegurar directorios
[SALIDAS_DIR, SALIDA_XHTML, SALIDA_JSON].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const app = express();

// Middleware CORS universal para permitir peticiones del orquestador y UIs externas
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir frontend estático
app.use(express.static(path.join(__dirname, 'public')));

const servidorHttp = http.createServer(app);
const servidorWs = new WebSocket.Server({ server: servidorHttp });

function log(m) { console.log('✅ [' + new Date().toISOString() + '] ' + m); }
function error(m) { console.error('❌ [' + new Date().toISOString() + '] ' + m); }

function obtenerCSSCanonico() {
    try {
        if (fs.existsSync(CSS_CANONICO_PATH)) {
            const css = fs.readFileSync(CSS_CANONICO_PATH, 'utf8');
            return purgarCSSInDesign(css);
        }
    } catch(e) {
        error('No se pudo cargar CSS canónico: ' + e.message);
    }
    return '/* CSS Básico */\nbody { font-family: serif; margin: 20px; }';
}

/**
 * Compila datos JSON estructurados
 */
async function ejecutarCompilacion(jsonData, nombreDocumento = 'documento') {
    const docNormalizado = jsonEditorialAdapter(jsonData);
    const nombreBase = String(nombreDocumento).replace(/\.indd$/i, '').replace(/[^a-zA-Z0-9-_]/g, '_');

    const resultado = await compilarLexmotor(
        docNormalizado,
        nombreBase,
        'Lexdigital_Modular.css',
        { debug: false }
    );

    if (resultado && resultado.xhtml) {
        const css = obtenerCSSCanonico();
        let xhtmlFinal = resultado.xhtml;
        if (!xhtmlFinal.includes('<style>') && css) {
            xhtmlFinal = xhtmlFinal.replace(
                '</head>',
                `  <style>\n${css}\n  </style>\n</head>`
            );
        }
        return {
            exito: true,
            nombreBase,
            xhtml: xhtmlFinal,
            jsonOficial: resultado.jsonOficial,
            metadatos: resultado.metadatos
        };
    }

    throw new Error('El motor no produjo salida XHTML válida');
}

// ============================================
// ENDPOINTS REST & SSE (Compatibilidad Orquestador y Contratos MVP)
// ============================================

const RAIZ_PROYECTO = path.resolve(__dirname, '..');
const sseSubscribers = new Set();
let buildEnCurso = false;

function broadcastSSE(mensaje, eventName = null) {
    for (const client of sseSubscribers) {
        try {
            if (eventName) {
                client.write(`event: ${eventName}\ndata: ${typeof mensaje === 'object' ? JSON.stringify(mensaje) : mensaje}\n\n`);
            } else {
                client.write(`data: ${typeof mensaje === 'object' ? JSON.stringify(mensaje) : mensaje}\n\n`);
            }
        } catch (_) {
            sseSubscribers.delete(client);
        }
    }
}

// Health check para orquestadores y watchdog (MVP-052-FIX)
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'lexdigital-pipeline',
        version: config.version || '2.0.0',
        uptime: process.uptime()
    });
});

// Superficie modular (MVP-053)
app.get('/modular', (req, res) => {
    res.json({
        status: 'OK',
        modulos: ['catalogo', 'timeline', 'metricas', 'dashboards', 'xhtml', 'fs', 'integrity', 'pipeline']
    });
});

// Flujo SSE en tiempo real para orquestador y monitores (MVP-052-FIX / lexdigitalhd-orchestrator)
app.get('/build-stream', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    res.write('data: Conectado a LexDigital Pipeline SSE Stream (v2.0.0)\n\n');
    sseSubscribers.add(res);

    req.on('close', () => {
        sseSubscribers.delete(res);
    });
});

// Disparador de compilación para el orquestador (MVP-052-FIX / lexdigitalhd-orchestrator)
app.post('/build', async (req, res) => {
    if (buildEnCurso) {
        return res.status(409).json({ status: 'ERROR', mensaje: 'build en curso' });
    }

    buildEnCurso = true;
    const txId = 'tx-' + Date.now();
    const runId = 'run-' + Math.random().toString(36).substring(2, 9);

    // Responder inmediatamente confirmando aceptación según contrato del orquestador
    res.status(202).json({
        status: 'OK',
        mensaje: 'Orquestador aceptó la ejecución',
        txId,
        runId
    });

    broadcastSSE(`> [${txId}] Iniciando pipeline...`);

    try {
        const body = req.body || {};
        if (body.datos || body.contenido || body.documento) {
            broadcastSSE('> Compilando documento recibido vía payload...');
            const datos = body.datos || body;
            const titulo = (datos.documento && datos.documento.titulo) || datos.titulo || 'documento_build';
            const compilacion = await ejecutarCompilacion(datos, titulo);
            const rutaSalida = path.join(SALIDA_XHTML, `${compilacion.nombreBase}_BUILD.xhtml`);
            fs.writeFileSync(rutaSalida, compilacion.xhtml, 'utf8');

            broadcastSSE(`> XHTML generado exitosamente (${compilacion.xhtml.length} bytes).`);
            broadcastSSE('> Compilación finalizada con éxito.');
            broadcastSSE({ status: 'success', txId, runId, archivo: rutaSalida }, 'pipeline.completed');
            buildEnCurso = false;
        } else {
            // Ejecutar build público del proyecto principal
            broadcastSSE('> Ejecutando npm run build:public en proyecto raíz...');
            const { spawn } = require('child_process');
            const isWin = process.platform === 'win32';
            const cmd = isWin ? 'npm.cmd' : 'npm';
            const buildProcess = spawn(cmd, ['run', 'build:public'], { cwd: RAIZ_PROYECTO, detached: false });

            buildProcess.stdout.on('data', (chunk) => {
                chunk.toString().split('\n').forEach(line => {
                    if (line.trim()) broadcastSSE(line.trim());
                });
            });

            buildProcess.stderr.on('data', (chunk) => {
                chunk.toString().split('\n').forEach(line => {
                    if (line.trim()) broadcastSSE(`[STDERR] ${line.trim()}`);
                });
            });

            buildProcess.on('error', (err) => {
                error('Error en proceso build: ' + err.message);
                broadcastSSE(`> PIPELINE_ERROR: ${err.message}`);
                broadcastSSE({ status: 'error', error: err.message }, 'pipeline.completed');
                buildEnCurso = false;
            });

            buildProcess.on('close', (code) => {
                if (code === 0) {
                    broadcastSSE('> Compilación finalizada con éxito.');
                    broadcastSSE({ status: 'success', txId, runId, code }, 'pipeline.completed');
                } else {
                    broadcastSSE(`> PIPELINE_ERROR: finalizado con código ${code}`);
                    broadcastSSE({ status: 'error', txId, runId, code }, 'pipeline.completed');
                }
                buildEnCurso = false;
            });
        }
    } catch (err) {
        error('Error durante ejecución /build: ' + err.message);
        broadcastSSE(`> PIPELINE_ERROR: ${err.message}`);
        broadcastSSE({ status: 'error', error: err.message }, 'pipeline.completed');
        buildEnCurso = false;
    }
});

// Render directo para LEDM/JSON (MVP-054)
app.post('/render', async (req, res) => {
    try {
        const body = req.body;
        if (!body || typeof body !== 'object') {
            return res.status(400).json({ status: 'ERROR', mensaje: 'JSON inválido' });
        }
        const titulo = (body.documento && body.documento.titulo) || body.titulo || 'documento_render';
        const compilacion = await ejecutarCompilacion(body, titulo);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(compilacion.xhtml);
    } catch (err) {
        return res.status(500).json({ status: 'ERROR', mensaje: err.message });
    }
});

// Endpoint de Ingesta directa para el plugin de InDesign UXP (lexmotor-uxp-plugin)
app.post('/api/ingest', async (req, res) => {
    log('Petición de ingesta UXP recibida en /api/ingest');
    try {
        const payload = req.body;
        if (!payload || typeof payload !== 'object') {
            return res.status(400).json({ success: false, error: 'Payload de ingesta inválido.' });
        }

        const titulo = (payload.metadata && payload.metadata.documentName) || 
                       (payload.documento && (payload.documento.titulo || payload.documento)) ||
                       payload.titulo || 
                       'documento_uxp';

        broadcastSSE(`> [UXP Ingest] Documento recibido: ${titulo}`);

        // Persistir también copia en ipc/ para respaldo del pipeline
        try {
            fs.writeFileSync(PLUGIN_JSON, JSON.stringify(payload, null, 2), 'utf8');
        } catch (_) {}

        const compilacion = await ejecutarCompilacion(payload, titulo);
        const rutaSalida = path.join(SALIDA_XHTML, `${compilacion.nombreBase}_UXP.xhtml`);
        fs.writeFileSync(rutaSalida, compilacion.xhtml, 'utf8');

        const evidenceId = 'hash-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

        broadcastSSE(`> [UXP Ingest] Compilado exitosamente: ${rutaSalida}`);
        broadcastSSE({ status: 'success', evidenceId, archivo: rutaSalida }, 'pipeline.completed');

        return res.status(200).json({
            success: true,
            message: 'Evidencia aceptada y compilada exitosamente',
            evidenceId: evidenceId,
            archivoSalida: rutaSalida,
            bytes: compilacion.xhtml.length,
            metadatos: compilacion.metadatos
        });
    } catch (err) {
        error('Error en /api/ingest: ' + err.message);
        broadcastSSE(`> [UXP Ingest Error] ${err.message}`);
        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
});



// ============================================
// ENDPOINTS REST
// ============================================

// Estado del servicio
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        service: 'LexDigital Pipeline',
        version: config.version || '2.0.0',
        uptime: process.uptime(),
        port: PORT,
        rutas: {
            xhtml: SALIDA_XHTML,
            json: SALIDA_JSON,
            salidas: SALIDAS_DIR
        }
    });
});

// Endpoint principal consumido por public/index.html
app.post('/api/pipeline/procesar-json', async (req, res) => {
    log('Petición recibida en /api/pipeline/procesar-json');
    try {
        const { datos, outputFormat } = req.body;
        if (!datos || typeof datos !== 'object') {
            return res.status(400).json({ success: false, error: 'Se requiere el objeto "datos" en el cuerpo de la petición.' });
        }

        const formato = String(outputFormat || 'xhtml').toLowerCase();
        const titulo = (datos.documento && datos.documento.titulo) || datos.titulo || 'documento_editorial';
        const compilacion = await ejecutarCompilacion(datos, titulo);

        let archivoGenerado = '';
        let mimeType = 'application/json';

        if (formato === 'xhtml') {
            archivoGenerado = path.join(SALIDA_XHTML, `${compilacion.nombreBase}.xhtml`);
            fs.writeFileSync(archivoGenerado, compilacion.xhtml, 'utf8');
            mimeType = 'application/xhtml+xml';
        } else if (formato === 'json') {
            archivoGenerado = path.join(SALIDA_JSON, `${compilacion.nombreBase}_normalizado.json`);
            fs.writeFileSync(archivoGenerado, JSON.stringify(compilacion.jsonOficial, null, 2), 'utf8');
        } else if (formato === 'pdf') {
            archivoGenerado = path.join(SALIDAS_DIR, `${compilacion.nombreBase}.pdf`);
            try {
                const puppeteer = require('puppeteer');
                const browser = await puppeteer.launch({
                    headless: 'new',
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
                const page = await browser.newPage();
                await page.setContent(compilacion.xhtml, { waitUntil: 'domcontentloaded' });
                await page.pdf({ path: archivoGenerado, format: 'A4', printBackground: true });
                await browser.close();
                mimeType = 'application/pdf';
                log(`PDF renderizado exitosamente: ${archivoGenerado}`);
            } catch (pdfErr) {
                error('Fallo renderizado PDF Puppeteer: ' + pdfErr.message);
                // Fallback a XHTML si Puppeteer falla
                archivoGenerado = path.join(SALIDA_XHTML, `${compilacion.nombreBase}.xhtml`);
                fs.writeFileSync(archivoGenerado, compilacion.xhtml, 'utf8');
            }
        } else {
            archivoGenerado = path.join(SALIDA_XHTML, `${compilacion.nombreBase}.xhtml`);
            fs.writeFileSync(archivoGenerado, compilacion.xhtml, 'utf8');
        }

        log(`Compilación exitosa [${formato}]: ${archivoGenerado}`);

        res.json({
            success: true,
            mensaje: `Compilación completada exitosamente en formato ${formato.toUpperCase()}`,
            archivoSalida: archivoGenerado,
            formato: formato,
            bytes: fs.existsSync(archivoGenerado) ? fs.statSync(archivoGenerado).size : 0,
            metadatos: compilacion.metadatos
        });

    } catch (err) {
        error('Error en /api/pipeline/procesar-json: ' + err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Endpoint legado para panel UXP
app.post('/api/compilar', async (req, res) => {
    log('Recibida petición POST en /api/compilar');
    try {
        let jsonData = null;
        if (req.body && (req.body.contenido || req.body.documento)) {
            jsonData = req.body;
        } else if (fs.existsSync(PLUGIN_JSON)) {
            jsonData = JSON.parse(fs.readFileSync(PLUGIN_JSON, 'utf8'));
        }

        if (!jsonData) {
            return res.status(400).json({ success: false, error: 'No se encontraron datos de documento en el body ni en ' + PLUGIN_JSON });
        }

        const titulo = (jsonData.documento && jsonData.documento.titulo) || jsonData.titulo || 'documento';
        const compilacion = await ejecutarCompilacion(jsonData, titulo);
        const rutaSalida = path.join(SALIDA_XHTML, `${compilacion.nombreBase}_AUTOMATICO.xhtml`);
        fs.writeFileSync(rutaSalida, compilacion.xhtml, 'utf8');

        res.json({
            success: true,
            message: 'Compilación industrial con lextilos.css completada',
            output: `Archivo generado en: ${rutaSalida} (${compilacion.xhtml.length} bytes)`
        });
    } catch(e) {
        error('Error procesando POST /api/compilar: ' + e.message);
        res.status(500).json({ success: false, error: e.message });
    }
});

// ============================================
// SERVIDOR WEBSOCKET BIDIRECCIONAL
// ============================================
servidorWs.on('connection', (ws) => {
    log('Cliente WebSocket conectado');

    ws.send(JSON.stringify({
        tipo: 'conexion',
        mensaje: 'Conectado a LexDigital Pipeline WebSocket Server',
        version: '2.0.0'
    }));

    ws.on('message', async (mensaje) => {
        try {
            const peticion = JSON.parse(mensaje);
            log(`WS mensaje recibido: ${peticion.action || peticion.tipo || 'comando'}`);

            if (peticion.action === 'ping') {
                return ws.send(JSON.stringify({ tipo: 'pong', timestamp: Date.now() }));
            }

            if (peticion.action === 'compilar' || peticion.datos) {
                const datos = peticion.datos || peticion;
                const nombre = peticion.nombre || 'documento_ws';
                ws.send(JSON.stringify({ tipo: 'progreso', fase: 'Iniciando compilación...' }));

                const resultado = await ejecutarCompilacion(datos, nombre);
                const rutaSalida = path.join(SALIDA_XHTML, `${resultado.nombreBase}_WS.xhtml`);
                fs.writeFileSync(rutaSalida, resultado.xhtml, 'utf8');

                ws.send(JSON.stringify({
                    tipo: 'resultado',
                    success: true,
                    archivo: rutaSalida,
                    bytes: resultado.xhtml.length,
                    metadatos: resultado.metadatos
                }));
            }
        } catch (e) {
            error('Error en mensaje WebSocket: ' + e.message);
            ws.send(JSON.stringify({ tipo: 'error', error: e.message }));
        }
    });

    ws.on('close', () => {
        log('Cliente WebSocket desconectado');
    });

    ws.on('error', (err) => {
        error('Error en WebSocket: ' + err.message);
    });
});

// ============================================
// WATCHER OPCIONAL PARA PLUGIN_JSON
// ============================================
let procesandoWatcher = false;
function iniciarWatcherPlugin() {
    if (fs.existsSync(path.dirname(PLUGIN_JSON))) {
        let chokidar;
        try {
            chokidar = require('chokidar');
        } catch (e) {
            log('Chokidar no disponible para watcher: ' + e.message, 'WARN');
            return null;
        }
        const watcher = chokidar.watch(PLUGIN_JSON, {
            persistent: true,
            awaitWriteFinish: { stabilityThreshold: 1000 }
        });
        watcher.on('change', async () => {
            if (procesandoWatcher) return;
            procesandoWatcher = true;
            log('Cambio detectado en JSON del plugin');
            try {
                const jsonData = JSON.parse(fs.readFileSync(PLUGIN_JSON, 'utf8'));
                const titulo = (jsonData.documento && jsonData.documento.titulo) || 'documento';
                const comp = await ejecutarCompilacion(jsonData, titulo);
                const ruta = path.join(SALIDA_XHTML, `${comp.nombreBase}_AUTOMATICO.xhtml`);
                fs.writeFileSync(ruta, comp.xhtml, 'utf8');
                log('Compilación automática watcher completada: ' + ruta);
            } catch(e) {
                error('Error en watcher: ' + e.message);
            }
            procesandoWatcher = false;
        });
        return watcher;
    }
    return null;
}

function iniciarServidor(puerto = PORT, host = HOST, habilitarWatcher = true) {
    return new Promise((resolve, reject) => {
        servidorHttp.listen(puerto, host, () => {
            console.log('\n============================================================');
            console.log('   LEXDIGITAL PIPELINE v2.0 - SERVIDOR HTTP & WEBSOCKET');
            console.log('============================================================');
            console.log(`HTTP UI:        http://${host}:${puerto}`);
            console.log(`WebSocket:      ws://${host}:${puerto}`);
            console.log(`Endpoint REST:  POST http://${host}:${puerto}/api/pipeline/procesar-json`);
            console.log(`Salida XHTML:   ${SALIDA_XHTML}`);
            console.log('============================================================\n');

            let watcher = null;
            if (habilitarWatcher) {
                watcher = iniciarWatcherPlugin();
            }

            servidorHttp.on('close', () => {
                if (watcher) watcher.close();
                try { servidorWs.close(); } catch(e) {}
            });

            resolve(servidorHttp);
        });
        servidorHttp.on('error', reject);
    });
}

if (require.main === module) {
    iniciarServidor(PORT, HOST, true).catch(err => {
        if (err.code === 'EADDRINUSE') {
            error(`El puerto ${PORT} ya está en uso.`);
        } else {
            error('Fallo al iniciar servidor: ' + err.message);
        }
        process.exit(1);
    });
}

module.exports = {
    app,
    servidorHttp,
    servidorWs,
    iniciarServidor,
    ejecutarCompilacion
};