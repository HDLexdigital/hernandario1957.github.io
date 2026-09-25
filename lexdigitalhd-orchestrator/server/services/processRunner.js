// server/services/processRunner.js
const { spawn } = require('child_process');
const { broadcast } = require('./sseManager');

/**
 * Ejecuta un proceso en el sistema operativo y retransmite su salida por SSE.
 * @param {string} command - Comando a ejecutar (ej. 'python3', 'bash')
 * @param {Array} args - Argumentos del comando
 * @param {string} processName - Nombre amigable para los logs
 * @returns {Promise} 
 */
function runProcess(command, args, processName) {
    return new Promise((resolve, reject) => {
        broadcast(`⚙️ [${processName}]: Iniciando proceso...`, 'info');

        // spawn lanza el proceso en un hilo separado del SO
        const child = spawn(command, args);

        // Capturar salida estándar (stdout)
        child.stdout.on('data', (data) => {
            // Limpiamos saltos de línea extra para que el log se vea ordenado
            const text = data.toString().trim();
            if (text) broadcast(`[\({processName}]:\){text}`, 'info');
        });

        // Capturar errores o advertencias (stderr)
        child.stderr.on('data', (data) => {
            const text = data.toString().trim();
            if (text) broadcast(`[\({processName}] ADVERTENCIA:\){text}`, 'warn');
        });

        // Detectar cuando el proceso termina
        child.on('close', (code) => {
            if (code === 0) {
                broadcast(`✅ [${processName}]: Finalizado correctamente.`, 'success');
                resolve(`Proceso ${processName} terminado`);
            } else {
                broadcast(`❌ [\({processName}]: Falló con código de salida\){code}`, 'error');
                reject(new Error(`\({processName} falló con código\){code}`));
            }
        });

        // Capturar errores a nivel del sistema operativo (ej. comando no encontrado)
        child.on('error', (err) => {
            broadcast(`❌ [\({processName}] ERROR CRÍTICO:\){err.message}`, 'error');
            reject(err);
        });
    });
}

module.exports = { runProcess };