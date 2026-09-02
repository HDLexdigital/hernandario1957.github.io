'use strict';
const http = require('http');
const express = require('express');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { compilarLexmotor } = require('../src/core/compiladores/compilarLexmotor');
const HOST = '127.0.0.1';
const PORT = 8765;
const PLUGIN_JSON = 'C:/Users/PC/AppData/Roaming/Adobe/UXP/PluginsStorage/IDSN/21/Developer/com.lexmotor.uxp/PluginData/documento_extraido.json';
const SALIDA_XHTML = path.join(__dirname, '..', 'salidaXHTML');
const LEXTILOS_CSS = path.join(__dirname, '..', 'estilos', 'lextilos.css');
const app = express();
app.use(express.json({ limit: '50mb' }));
const servidorHttp = http.createServer(app);
const servidorWs = new WebSocket.Server({ server: servidorHttp });
function log(m) { console.log('✅ [' + new Date().toISOString() + '] ' + m); }
function error(m) { console.error('❌ ' + m); }
function obtenerLextilosCSS() {
    try {
        if (fs.existsSync(LEXTILOS_CSS)) {
            const css = fs.readFileSync(LEXTILOS_CSS, 'utf8');
            log('lextilos.css cargado: ' + css.length + ' bytes');
            return css;
        }
    } catch(e) {
        error('No se pudo cargar lextilos.css: ' + e.message);
    }
    return null;
}
function compilarConLextilos(jsonData) {
    let contenido = [];
    if (jsonData.contenido && Array.isArray(jsonData.contenido)) {
        contenido = jsonData.contenido;
    }
    if (contenido.length === 0) return null;
    // Compilar XHTML
    const resultado = compilarLexmotor({ contenido }, {});
    if (resultado && resultado.xhtml) {
        // OBTENER LEXTILOS.CSS EXACTO
        const cssCanonico = obtenerLextilosCSS();
        if (!cssCanonico) {
            error('No se pudo obtener lextilos.css');
            return { exito: false, error: 'lextilos.css no disponible' };
        }
        // Inyectar lextilos.css EXACTO
        const xhtmlConCSS = resultado.xhtml.replace(
            '</head>',
            '  <style>\n' + cssCanonico + '  </style>\n</head>'
        );
        // Guardar
        const nombreBase = (jsonData.documento && jsonData.documento.titulo) || 'documento';
        const nombreLimpio = String(nombreBase).replace(/\.indd$/i, '').replace(/[^a-zA-Z0-9-_]/g, '_');
        const rutaSalida = path.join(SALIDA_XHTML, `${nombreLimpio}_AUTOMATICO.xhtml`);
        fs.writeFileSync(rutaSalida, xhtmlConCSS, 'utf8');
        log('XHTML: ' + xhtmlConCSS.length + ' bytes');
        log('CSS lextilos: ' + cssCanonico.length + ' bytes');
        log('Guardado: ' + rutaSalida);
        return { exito: true, bytes: xhtmlConCSS.length, ruta: rutaSalida };
    }
    return { exito: false, error: 'No XHTML' };
}
// Watcher
let procesando = false;
const watcher = chokidar.watch(PLUGIN_JSON, {
    persistent: true,
    awaitWriteFinish: { stabilityThreshold: 1000 }
});
watcher.on('change', () => {
    if (procesando) return;
    procesando = true;
    log('Cambio detectado en JSON del plugin');
    try {
        const jsonData = JSON.parse(fs.readFileSync(PLUGIN_JSON, 'utf8'));
        compilarConLextilos(jsonData);
    } catch(e) {
        error('Error: ' + e.message);
    }
    procesando = false;
});
// Endpoint HTTP para recibir la orden desde el panel UXP
app.post('/api/compilar', (req, res) => {
    log('Recibida petición POST en /api/compilar');
    try {
        if (fs.existsSync(PLUGIN_JSON)) {
            const jsonData = JSON.parse(fs.readFileSync(PLUGIN_JSON, 'utf8'));
            const resultado = compilarConLextilos(jsonData);
            
            if (resultado && resultado.exito) {
                res.json({ 
                    success: true, 
                    message: 'Compilación industrial con lextilos.css completada', 
                    output: `Archivo generado en: ${resultado.ruta} (${resultado.bytes} bytes)` 
                });
            } else {
                res.status(500).json({ success: false, error: resultado.error || 'Error desconocido al compilar' });
            }
        } else {
            res.status(400).json({ success: false, error: 'El archivo JSON del plugin aún no existe en AppData.' });
        }
    } catch(e) {
        error('Error procesando POST /api/compilar: ' + e.message);
        res.status(500).json({ success: false, error: e.message });
    }
});
servidorHttp.listen(PORT, HOST, () => {
    console.log('');
    console.log('============================================================');
    console.log('   LEXDIGITAL PIPELINE CON LEXTILOS.CSS');
    console.log('============================================================');
    console.log('CSS canónico: ' + LEXTILOS_CSS);
    console.log('============================================================');
    log('Watcher listo');
});