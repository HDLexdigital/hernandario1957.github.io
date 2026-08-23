/**
 * @fileoverview start-worker.js
 * E17.4-B — Lifecycle Wrapper: Demonio Residente con Suspensión Adaptativa
 */

'use strict';

const FileTransportWorker = require('./FileTransportWorker');
const { ejecutarCLI } = require('../../cli/lexmotorCLI');
const path = require('path');
const fs = require('fs');
const os = require('os');

// ==========================================
// CONFIGURACIÓN DE LA MÁQUINA DE ESTADOS
// ==========================================
const HEARTBEAT_INTERVAL_MS = 3000;
const STALE_THRESHOLD_MS = 10000; // ~3 latidos perdidos = InDesign inactivo
const POLLING_ACTIVE_MS = 250;
const POLLING_SUSPENDED_MS = 5000;

let currentState = 'BOOT';
let currentInstanceId = null;
let workerInstance = null;

const rendezvousPath = path.join(os.homedir(), '.lexdigital', 'active-ipc-root.json');

// 1. Override manual (Para soporte administrativo)
const args = process.argv.slice(2);
let overrideIpcRoot = null;
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--ipc-root' || args[i] === '--ipcRoot') {
        overrideIpcRoot = args[i + 1];
        break;
    }
}

// ==========================================
// 2. VALIDACIÓN ESTRICTA DEL CONTRATO RENDEZVOUS
// ==========================================
function parseRendezvous() {
    if (overrideIpcRoot) {
        return {
            ipcRoot: overrideIpcRoot,
            instanceId: 'OVERRIDE_MANUAL',
            hbTime: Date.now()
        };
    }
    
    try {
        if (!fs.existsSync(rendezvousPath)) return null;
        const raw = fs.readFileSync(rendezvousPath, 'utf8');
        const lease = JSON.parse(raw);

        // Blindaje contra contratos corruptos o rutas relativas
        if (!lease.ipcRoot || typeof lease.ipcRoot !== 'string' || !path.isAbsolute(lease.ipcRoot)) {
            return null; 
        }
        
        // Validación matemática de la marca de tiempo
        const hbTime = new Date(lease.heartbeatAt || lease.updatedAt).getTime();
        if (isNaN(hbTime)) {
            return null;
        }

        return { ...lease, hbTime };
    } catch (e) {
        // Silencioso. Evita crashes si UXP está escribiendo el archivo atómicamente
        return null;
    }
}

// ==========================================
// 3. MONTAJE DEL WORKER (E14-E16.3 CONGELADO)
// ==========================================
function montarWorker(ipcRoot) {
    try {
        const subcarpetas = ['requests', 'responses', 'errors'];
        subcarpetas.forEach(sub => {
            const dir = path.join(ipcRoot, sub);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        });
    } catch (fsErr) {
        console.error(`[FATAL FS] Imposible acceder a IPC Root: ${ipcRoot}`, fsErr.message);
        return null;
    }

    return new FileTransportWorker({
        ipcRoot: ipcRoot,
        executeCLI: async (request) => {
            const cliArgs = ['compile'];
            if (request.input) cliArgs.push('--input', request.input);
            if (request.semanticMap) cliArgs.push('--semantic-map', request.semanticMap);
            if (request.css) cliArgs.push('--css', request.css);
            if (request.output) cliArgs.push('--output', request.output);

            const code = await ejecutarCLI(cliArgs);

            return {
                exitCode: code,
                status: code === 0 ? 'SUCCESS' : 'ERROR',
                diagnostics: [],
                metrics: {}
            };
        }
    });
}

// ==========================================
// 4. BUCLE PRINCIPAL (EL DIRECTOR DE ORQUESTA)
// ==========================================
async function cicloDeVida() {
    const lease = parseRendezvous();
    const prevState = currentState;
    let nextTickMs = POLLING_SUSPENDED_MS;

    // A. RESOLUCIÓN DEL ESTADO (Sin instanciar nada todavía)
    if (!lease) {
        currentState = 'SUSPENDED';
    } else {
        const ageMs = Date.now() - lease.hbTime;
        
        if (ageMs > STALE_THRESHOLD_MS && !overrideIpcRoot) {
            currentState = 'STALE';
        } else {
            currentState = 'ACTIVE';
            nextTickMs = POLLING_ACTIVE_MS;
        }
    }

    // B. GESTIÓN DEL WORKER (MONTAR / DESMONTAR)
    if (currentState === 'ACTIVE') {
        if (lease.instanceId !== currentInstanceId) {
            console.log(`[LIFECYCLE] Reconfigurando para sesión UXP: ${lease.instanceId || 'Sesion-Legacy'}`);
            currentInstanceId = lease.instanceId;
            workerInstance = montarWorker(lease.ipcRoot);
        }
    } else {
        // SUSPENDED o STALE: El worker se destruye, forzando un remontaje cuando vuelva a ACTIVE
        if (workerInstance) {
            console.log(`[LIFECYCLE] Desmontando Worker (Transición a ${currentState}).`);
            workerInstance = null;
            currentInstanceId = null;
        }
    }

    // C. TELEMETRÍA DE TRANSICIÓN
    if (prevState !== currentState) {
        console.log(`[LIFECYCLE] Transición: ${prevState} -> ${currentState} (Tick: ${nextTickMs}ms)`);
    }

    // D. EJECUCIÓN DEL TRANSPORTE (EXCLUSIVO DE ACTIVE)
    if (currentState === 'ACTIVE' && workerInstance) {
        try {
            // El await frena el bucle de vida: no se transiciona mientras haya un request en vuelo
            const processed = await workerInstance.processPendingRequests();
            if (processed && processed.length > 0) {
                processed.forEach(res => {
                    console.log(`[${new Date().toISOString()}] Solicitud procesada: ${res.requestId}`);
                });
            }
        } catch (error) {
            console.error(`[ERROR FATAL WORKER]: ${error.message}`);
        }
    }

    // E. RECURSIÓN ADAPTATIVA
    setTimeout(cicloDeVida, nextTickMs);
}

// ==========================================
// BOOTSTRAP DEL PROCESO
// ==========================================
console.log('\n=================================================');
console.log('   Iniciando LexDigital Worker Daemon (E17.4)');
console.log('=================================================');
if (overrideIpcRoot) {
    console.log(`[OVERRIDE] Modo administrativo manual activo.`);
    console.log(`[OVERRIDE] Forzando ruta: ${overrideIpcRoot}`);
} else {
    console.log(`[BOOT] Vigilando pasivamente el Rendezvous en:`);
    console.log(`       ${rendezvousPath}`);
}
console.log('-------------------------------------------------\n');

// Disparar la Máquina de Estados
cicloDeVida();