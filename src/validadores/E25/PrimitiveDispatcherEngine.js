/**
 * E25.2 — PrimitiveDispatcherEngine
 * 
 * - Despacha secuencialmente primitivas físicas hacia InDesign vía IPC.
 * - Evita bloquear el Event Loop (usa async/await).
 * - Implementa Fail-Fast: se detiene al primer error.
 * - Asegura la integridad correlacional (commandId, executionId, sessionId).
 * - Garantiza la frontera JSON-Safe (Invariante 4).
 * - Emite el Execution Ledger.
 */

'use strict';

class PrimitiveDispatcherEngine {
    
    /**
     * Despacha un array de comandos físicos hacia InDesign.
     * @param {Array<Object>} commands - Comandos generados por E25.1.
     * @param {Function} ipcTransportFn - Función async que interactúa con el host.
     * @param {Object} options - Configuraciones como `primitiveTimeoutMs`.
     * @returns {Object} Execution Ledger determinista.
     */
    static async dispatchAll(commands, ipcTransportFn, options = {}) {
        const timeoutMs = options.primitiveTimeoutMs || 5000;
        
        const ledger = {
            executionId: commands[0]?.executionId || null,
            sessionId: commands[0]?.sessionId || null,
            status: 'SUCCESS',
            executed: [],
            failed: null,
            notAttempted: []
        };

        for (let i = 0; i < commands.length; i++) {
            const cmd = commands[i];

            // 1. JSON-Safe Check (I4)
            if (!this._isJsonSafe(cmd)) {
                ledger.status = 'HALTED';
                ledger.failed = { command: cmd, reason: 'JSON_SAFE_VIOLATION' };
                ledger.notAttempted = commands.slice(i + 1);
                return ledger;
            }

            // 2. Dispatch con Timeout (I3)
            try {
                const response = await this._dispatchWithTimeout(cmd, ipcTransportFn, timeoutMs);

                // 3. Correlation Integrity (I6)
                if (response.commandId !== cmd.commandId) {
                    throw new Error('CORRELATION_ERROR_COMMAND_ID');
                }
                if (response.sessionId !== cmd.sessionId) {
                    throw new Error('CORRELATION_ERROR_SESSION_ID');
                }
                if (response.executionId !== cmd.executionId) {
                    throw new Error('CORRELATION_ERROR_EXECUTION_ID');
                }

                // 4. Fallo Físico de InDesign (I2)
                if (response.status !== 'SUCCESS') {
                    ledger.status = 'HALTED';
                    ledger.failed = { 
                        command: cmd, 
                        reason: response.error || 'HOST_EXECUTION_ERROR', 
                        details: response 
                    };
                    ledger.notAttempted = commands.slice(i + 1);
                    return ledger;
                }

                // Éxito: Añadir al ledger y continuar el loop (I1)
                ledger.executed.push(cmd);

            } catch (error) {
                // Timeout o error de correlación
                ledger.status = 'HALTED';
                ledger.failed = { 
                    command: cmd, 
                    reason: error.message.includes('TIMEOUT') ? 'PRIMITIVE_TIMEOUT' : error.message
                };
                ledger.notAttempted = commands.slice(i + 1);
                return ledger;
            }
        }

        return ledger; // Status: SUCCESS
    }

    /**
     * Envuelve la llamada IPC con un timeout estricto, limpiando los timers
     * para evitar fugas de memoria (Open Handles) en el Event Loop de Node.js.
     */
    static _dispatchWithTimeout(cmd, ipcTransportFn, timeoutMs) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('PRIMITIVE_TIMEOUT'));
            }, timeoutMs);

            ipcTransportFn(cmd)
                .then(response => {
                    clearTimeout(timer); // Sella la fuga si InDesign responde rápido
                    resolve(response);
                })
                .catch(error => {
                    clearTimeout(timer); // Sella la fuga si InDesign rechaza rápido
                    reject(error);
                });
        });
    }

    /**
     * Valida que el comando no contenga funciones ni referencias circulares.
     */
    static _isJsonSafe(obj) {
        try {
            JSON.stringify(obj, (key, value) => {
                if (typeof value === 'function') {
                    throw new Error('JSON_SAFE_VIOLATION: Functions not allowed');
                }
                return value;
            });
            return true;
        } catch (e) {
            return false;
        }
    }
}

module.exports = PrimitiveDispatcherEngine;