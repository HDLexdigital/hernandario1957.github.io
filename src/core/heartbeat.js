'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const HEARTBEAT_INTERVAL_MS = 3000;
const ACTIVE_IPC_ROOT = path.join(os.homedir(), '.lexdigital', 'active-ipc-root.json');

let heartbeatTimer = null;

function asegurarDirectorio() {
    const dir = path.dirname(ACTIVE_IPC_ROOT);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function escribirAtomico(payload) {
    const tmp = ACTIVE_IPC_ROOT + '.tmp';
    try {
        fs.writeFileSync(tmp, JSON.stringify(payload, null, 2), 'utf8');
        fs.renameSync(tmp, ACTIVE_IPC_ROOT);
    } catch (error) {
        console.log('[heartbeat] error al escribir: ' + error.message);
    }
}

function escribirHeartbeat() {
    escribirAtomico({
        pid: process.pid,
        timestamp: new Date().toISOString(),
        status: 'ALIVE'
    });
}

function iniciarHeartbeat() {
    if (heartbeatTimer) return;

    asegurarDirectorio();

    // HB-01: primer latido inmediato
    escribirHeartbeat();

    // HB-02: intervalo nominal
    heartbeatTimer = setInterval(escribirHeartbeat, HEARTBEAT_INTERVAL_MS);

    console.log('[heartbeat] iniciado. Intervalo: ' + HEARTBEAT_INTERVAL_MS + ' ms');
}

function detenerHeartbeat() {
    // HB-05: idempotente
    if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
    }

    // HB-07 (Opción B): dejar rastro STOPPED atómico
    escribirAtomico({
        pid: process.pid,
        timestamp: new Date().toISOString(),
        status: 'STOPPED'
    });

    console.log('[heartbeat] detenido.');
}

module.exports = { iniciarHeartbeat, detenerHeartbeat };
