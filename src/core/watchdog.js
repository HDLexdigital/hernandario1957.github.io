'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const IPC_DIR = path.join(process.cwd(), 'ipc');
const REQUESTS_DIR = path.join(IPC_DIR, 'requests');
const RESPONSES_DIR = path.join(IPC_DIR, 'responses');

function asegurarDirectorios() {
    [IPC_DIR, REQUESTS_DIR, RESPONSES_DIR].forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
}

function procesarRequest(file) {
    const requestPath = path.join(REQUESTS_DIR, file);
    const responsePath = path.join(RESPONSES_DIR, file.replace('request-', 'response-'));

    try {
        const request = JSON.parse(fs.readFileSync(requestPath, 'utf8'));
        const comando = request.comando || 'echo "Sin comando definido"';
        const salida = execSync(comando, { cwd: process.cwd(), stdio: 'pipe' }).toString();

        fs.writeFileSync(responsePath, JSON.stringify({
            status: 'OK',
            salida,
            timestamp: new Date().toISOString()
        }, null, 2));

        fs.unlinkSync(requestPath);
        console.log('✅ Procesado: ' + file);
    } catch (error) {
        fs.writeFileSync(responsePath, JSON.stringify({
            status: 'ERROR',
            error: error.message,
            timestamp: new Date().toISOString()
        }, null, 2));
        fs.unlinkSync(requestPath);
        console.log('❌ Error procesando: ' + file);
    }
}

function iniciarWatchdog() {
    asegurarDirectorios();
    console.log('🐶 Watchdog iniciado. Observando ' + REQUESTS_DIR);

    setInterval(() => {
        const archivos = fs.readdirSync(REQUESTS_DIR).filter(f => f.startsWith('request-'));
        archivos.forEach(procesarRequest);
    }, 2000);
}

module.exports = { iniciarWatchdog };
