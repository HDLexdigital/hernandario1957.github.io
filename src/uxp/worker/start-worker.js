const FileTransportWorker = require('./FileTransportWorker');
const { ejecutarCLI } = require('../../cli/lexmotorCLI');
const path = require('path');

const POLLING_INTERVAL_MS = 1000;

// ¡EL PUENTE! Apuntamos a la caja de arena física de InDesign UXP
const UXP_SANDBOX_DIR = "C:\\Users\\PC\\AppData\\Roaming\\Adobe\\UXP\\PluginsStorage\\IDSN\\21\\Developer\\com.lexmotor.uxp\\PluginData\\ipc";

console.log('Iniciando Lexmotor UXP IPC Worker...');

try {
    const worker = new FileTransportWorker({
        ipcRoot: UXP_SANDBOX_DIR, // Forzamos la ruta del host
        executeCLI: async (request) => {
            const args = ['compile'];
            if (request.input) args.push('--input', request.input);
            if (request.semanticMap) args.push('--semantic-map', request.semanticMap);
            if (request.css) args.push('--css', request.css);
            if (request.output) args.push('--output', request.output);

            const code = await ejecutarCLI(args);

            return {
                exitCode: code,
                status: code === 0 ? 'SUCCESS' : 'ERROR',
                diagnostics: [], 
                metrics: {}
            };
        }
    });

    console.log(`Worker escuchando en: ${worker.requestsDir}`);
    console.log(`Intervalo de sondeo: ${POLLING_INTERVAL_MS}ms`);
    console.log('Esperando solicitudes desde Adobe InDesign (UXP)...\n');

    setInterval(async () => {
        try {
            const processed = await worker.processPendingRequests();
            if (processed && processed.length > 0) {
                processed.forEach(res => {
                    console.log(`[${new Date().toISOString()}] Solicitud procesada y respondida: ${res.requestId}`);
                });
            }
        } catch (error) {
            console.error(`[ERROR FATAL WORKER]: ${error.message}`);
        }
    }, POLLING_INTERVAL_MS);

} catch (error) {
    console.error('Fallo al inicializar el worker:', error.message);
    process.exit(1);
}