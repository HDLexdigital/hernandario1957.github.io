'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const HEARTBEAT_INTERVAL_MS = 3000;
const ACTIVE_IPC_ROOT = path.join(os.homedir(), '.lexdigital', 'active-ipc-root.json');

function iniciarHeartbeat() {
    const dir = path.dirname(ACTIVE_IPC_ROOT);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    setInterval(() => {
        const payload = {
            pid: process.pid,
            timestamp: new Date().toISOString(),
            status: 'ALIVE'
        };
        fs.writeFileSync(ACTIVE_IPC_ROOT, JSON.stringify(payload, null, 2), 'utf8');
    }, HEARTBEAT_INTERVAL_MS);

    console.log('Heartbeat iniciado. Intervalo: ' + HEARTBEAT_INTERVAL_MS + ' ms');
}

module.exports = { iniciarHeartbeat };
