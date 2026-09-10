'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const IPC_DIR = path.join(process.cwd(), 'ipc');
const REQUESTS_DIR = path.join(IPC_DIR, 'requests');
const RESPONSES_DIR = path.join(IPC_DIR, 'responses');

const WATCHDOG_TIMEOUT_MS = 30000;
const WATCHDOG_POLL_MS = 2000;

const OPERACIONES_PERMITIDAS = {
    'build:public': 'npm run build:public'
};

let intervalId = null;
let procesando = false;

function asegurarDirectorios() {
    [IPC_DIR, REQUESTS_DIR, RESPONSES_DIR].forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
}

function limpiarBOM(texto) {
    return texto.replace(/^\uFEFF/, '');
}

function escribirAtomico(ruta, contenido) {
    const tmp = ruta + '.tmp';
    fs.writeFileSync(tmp, contenido, 'utf8');
    fs.renameSync(tmp, ruta);
}

function validarRequest(request) {
    if (!request || typeof request !== 'object') {
        return { ok: false, mensaje: 'request no es objeto' };
    }
    if (!request.id || typeof request.id !== 'string') {
        return { ok: false, mensaje: 'falta id' };
    }
    if (!request.operacion || typeof request.operacion !== 'string') {
        return { ok: false, mensaje: 'falta operacion' };
    }
    if (!OPERACIONES_PERMITIDAS[request.operacion]) {
        return { ok: false, mensaje: 'operacion no permitida' };
    }
    return { ok: true };
}

function procesarRequest(file) {
    const requestPath = path.join(REQUESTS_DIR, file);
    const id = file.replace('request-', '').replace('.json', '');
    const responsePath = path.join(RESPONSES_DIR, 'response-' + id + '.json');

    let contenido;
    try {
        contenido = fs.readFileSync(requestPath, 'utf8');
    } catch (error) {
        console.log('[watchdog] no se pudo leer ' + file);
        return;
    }

    let request;
    try {
        request = JSON.parse(limpiarBOM(contenido));
    } catch (error) {
        escribirAtomico(responsePath, JSON.stringify({
            status: 'ERROR',
            mensaje: 'JSON invalido',
            detalle: error.message,
            timestamp: new Date().toISOString()
        }, null, 2));
        try { fs.unlinkSync(requestPath); } catch (_) {}
        return;
    }

    const validacion = validarRequest(request);
    if (!validacion.ok) {
        escribirAtomico(responsePath, JSON.stringify({
            status: 'ERROR',
            mensaje: validacion.mensaje,
            timestamp: new Date().toISOString()
        }, null, 2));
        try { fs.unlinkSync(requestPath); } catch (_) {}
        return;
    }

    const operacion = request.operacion;
    const comando = OPERACIONES_PERMITIDAS[operacion];

    try {
        const salida = execSync(comando, {
            cwd: process.cwd(),
            stdio: 'pipe',
            timeout: WATCHDOG_TIMEOUT_MS,
            encoding: 'utf8',
            env: { ...process.env, LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' }
        }).toString();

        escribirAtomico(responsePath, JSON.stringify({
            status: 'OK',
            operacion,
            salida,
            timestamp: new Date().toISOString()
        }, null, 2));
    } catch (error) {
        escribirAtomico(responsePath, JSON.stringify({
            status: 'ERROR',
            operacion,
            mensaje: error.message,
            timeout: error.signal === 'SIGTERM',
            timestamp: new Date().toISOString()
        }, null, 2));
    } finally {
        try { fs.unlinkSync(requestPath); } catch (_) {}
    }
}

function ciclo() {
    if (procesando) return;
    procesando = true;

    try {
        const archivos = fs.readdirSync(REQUESTS_DIR)
            .filter(f => f.startsWith('request-') && f.endsWith('.json'));

        archivos.forEach(procesarRequest);
    } catch (error) {
        console.log('[watchdog] error en ciclo: ' + error.message);
    } finally {
        procesando = false;
    }
}

function iniciarWatchdog() {
    asegurarDirectorios();
    console.log('[watchdog] iniciado. Observando ' + REQUESTS_DIR);

    if (intervalId) return;

    ciclo();
    intervalId = setInterval(ciclo, WATCHDOG_POLL_MS);
}

function detenerWatchdog() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log('[watchdog] detenido.');
    }
}

module.exports = { iniciarWatchdog, detenerWatchdog };
