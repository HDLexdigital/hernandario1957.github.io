'use strict';
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const PROYECTO_ROOT = "H:\\LexDigital\\Recursos\\AUTOMATIZAR INDESIGN\\proyecto-lexdigital_modular";
const ipcDir = process.env.LEXMOTOR_IPC_DIR || "C:\\Users\\PC\\AppData\\Roaming\\Adobe\\UXP\\PluginsStorage\\IDSN\\21\\Developer\\com.lexmotor.uxp\\PluginData\\ipc";
const requestsDir = path.join(ipcDir, 'requests');
const responsesDir = path.join(ipcDir, 'responses');
// Asegurar directorios
[requestsDir, responsesDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});
// ============================================
// LOGGER
// ============================================
function log(mensaje, tipo = 'INFO') {
    const prefijo = {
        INFO: '✅',
        WARN: '⚠️',
        ERROR: '❌',
        IPC: '📨',
        COMPILE: '⚙️'
    }[tipo] || '📄';
    console.log(`${prefijo} ${mensaje}`);
}
// ============================================
// FUNCIÓN PARA CARGAR MÓDULOS (LAZY)
// ============================================
let modulosCargados = null;
function cargarModulos() {
    if (modulosCargados) return modulosCargados;
    modulosCargados = {
        compilarLexmotor: require('../src/index').compilarLexmotor,
        adaptarInDesign: require('../src/adaptadores/InDesignAdapter').adaptarInDesign,
        purgarCSSInDesign: require('../src/utils/cssPurifier').purgarCSSInDesign
    };
    return modulosCargados;
}
// ============================================
// FUNCIÓN PARA PROCESAR REQUEST IPC
// ============================================
async function procesarRequest(filePath) {
    const fileName = path.basename(filePath);
    if (!fileName.startsWith('request-req-uxp-') || !fileName.endsWith('.json')) return;
    const requestId = fileName.replace('request-', '').replace('.json', '');
    log(`PETICIÓN RECIBIDA (id=${requestId})`, 'IPC');
    try {
        // Leer payload
        const payload = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        // Validar que tiene input
        if (!payload.input || !fs.existsSync(payload.input)) {
            throw new Error(`Input no encontrado: ${payload.input || 'no especificado'}`);
        }
        // Cargar módulos
        const { compilarLexmotor, adaptarInDesign, purgarCSSInDesign } = cargarModulos();
        // Leer input
        const inputData = JSON.parse(fs.readFileSync(payload.input, 'utf-8'));
        const semanticMap = payload.semanticMap && fs.existsSync(payload.semanticMap) 
            ? JSON.parse(fs.readFileSync(payload.semanticMap, 'utf-8')) 
            : null;
        // Guardar copia en MisJSON
        const carpetaMisJSON = path.join(PROYECTO_ROOT, 'MisJSON');
        if (!fs.existsSync(carpetaMisJSON)) fs.mkdirSync(carpetaMisJSON, { recursive: true });
        fs.writeFileSync(
            path.join(carpetaMisJSON, `input_${requestId}.json`),
            JSON.stringify(inputData, null, 2),
            'utf-8'
        );
        log(`INICIANDO COMPILACIÓN`, 'COMPILE');
        // Adaptar si es necesario
        let jsonNormalizado = inputData;
        try {
            const adaptacion = adaptarInDesign({ jsonCrudo: inputData, semanticMap });
            if (adaptacion && adaptacion.ast) {
                jsonNormalizado = adaptacion.ast;
                log('Adaptación E10 aplicada');
            }
        } catch (adaptError) {
            log(`Adaptación omitida: ${adaptError.message}`, 'WARN');
        }
        // Purificar CSS si existe
        if (payload.css && fs.existsSync(payload.css)) {
            try {
                const cssCrudo = fs.readFileSync(payload.css, 'utf-8');
                const cssLimpio = purgarCSSInDesign(cssCrudo);
                fs.writeFileSync(payload.css, cssLimpio, 'utf-8');
                log('CSS purificado');
            } catch (cssError) {
                log(`CSS omitido: ${cssError.message}`, 'WARN');
            }
        }
        // Compilar
        const resultado = await compilarLexmotor(
            jsonNormalizado,
            'InDesign_Export',
            '../estilos/fragmento.css'
        );
        log(`COMPILACIÓN COMPLETA (id=${requestId})`, 'COMPILE');
        // Guardar XHTML
        const carpetaSalida = path.join(PROYECTO_ROOT, 'salidaXHTML');
        if (!fs.existsSync(carpetaSalida)) fs.mkdirSync(carpetaSalida, { recursive: true });
        const rutaFinalXHTML = path.join(carpetaSalida, `export_${requestId}.xhtml`);
        let contenidoAEscribir = "";
        if (typeof resultado === 'string') {
            contenidoAEscribir = resultado;
        } else if (typeof resultado === 'object' && resultado !== null) {
            contenidoAEscribir = resultado.xhtml || resultado.html || JSON.stringify(resultado, null, 2);
        }
        fs.writeFileSync(rutaFinalXHTML, contenidoAEscribir, 'utf-8');
        log(`XHTML GENERADO: ${rutaFinalXHTML}`);
        // Escribir respuesta
        const responseData = {
            success: true,
            requestId: requestId,
            timestamp: new Date().toISOString(),
            result: resultado
        };
        const responsePath = path.join(responsesDir, `response-${requestId}.json`);
        fs.writeFileSync(responsePath, JSON.stringify(responseData, null, 2), 'utf-8');
        log(`RESPUESTA ENVIADA`, 'IPC');
        // Limpiar request
        fs.unlinkSync(filePath);
    } catch (error) {
        log(`ERROR COMPILACIÓN id=${requestId}`, 'ERROR');
        console.error(error.stack || error.message);
        // Escribir respuesta de error
        try {
            const responsePath = path.join(responsesDir, `response-${requestId}.json`);
            fs.writeFileSync(
                responsePath,
                JSON.stringify({ success: false, requestId, error: error.message }, null, 2),
                'utf-8'
            );
        } catch (e) {}
        // Limpiar request
        try { fs.unlinkSync(filePath); } catch (e) {}
    }
}
// ============================================
// INICIAR WATCHER
// ============================================
console.log('============================================================');
console.log('       PUENTE IPC LEXDIGITAL <-> INDESIGN ACTIVO');
console.log('============================================================');
console.log(`Vigilando: ${requestsDir}`);
console.log('Esperando peticiones desde UXP...\n');
const watcher = chokidar.watch(requestsDir, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 100 }
});
watcher.on('add', procesarRequest);
watcher.on('error', (error) => {
    log(`Error del watcher: ${error.message}`, 'ERROR');
});