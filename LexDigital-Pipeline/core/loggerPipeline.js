'use strict';
/**
 * Logger estructurado para LexDigital Pipeline
 * Soporta niveles: DEBUG, INFO, WARN, ERROR
 * Escribe a consola y archivo
 */
const fs = require('fs');
const path = require('path');
class LoggerPipeline {
    constructor(opciones = {}) {
        this.directorioLogs = opciones.directorio || path.join(__dirname, '../logs');
        this.nivelMinimo = opciones.nivel || 'info'; // debug, info, warn, error
        this.archivoActual = null;
        this.contador = 0;
        this.inicializar();
    }
    inicializar() {
        if (!fs.existsSync(this.directorioLogs)) {
            fs.mkdirSync(this.directorioLogs, { recursive: true });
        }
        const fecha = new Date().toISOString().split('T')[0];
        this.archivoActual = path.join(this.directorioLogs, `pipeline-${fecha}.log`);
        this.info(`Logger inicializado en: ${this.archivoActual}`);
    }
    /**
     * Verifica si un nivel debe ser registrado
     */
    deberiaRegistrar(nivel) {
        const niveles = { debug: 0, info: 1, warn: 2, error: 3 };
        return niveles[nivel] >= niveles[this.nivelMinimo];
    }
    /**
     * Formatea la entrada de log
     */
    formatear(nivel, mensaje, metadatos = {}) {
        return JSON.stringify({
            timestamp: new Date().toISOString(),
            nivel,
            mensaje,
            ...metadatos
        });
    }
    /**
     * Escribe a archivo
     */
    escribirArchivo(entrada) {
        try {
            fs.appendFileSync(this.archivoActual, entrada + '\n', 'utf-8');
        } catch (error) {
            console.error('Error escribiendo log:', error.message);
        }
    }
    /**
     * Log nivel INFO
     */
    info(mensaje, metadatos = {}) {
        if (!this.deberiaRegistrar('info')) return;
        this.contador++;
        const entrada = this.formatear('INFO', mensaje, metadatos);
        console.log(`✅ [INFO] ${mensaje}`);
        this.escribirArchivo(entrada);
    }
    /**
     * Log nivel WARN
     */
    warn(mensaje, metadatos = {}) {
        if (!this.deberiaRegistrar('warn')) return;
        this.contador++;
        const entrada = this.formatear('WARN', mensaje, metadatos);
        console.warn(`⚠️ [WARN] ${mensaje}`);
        this.escribirArchivo(entrada);
    }
    /**
     * Log nivel ERROR
     */
    error(mensaje, metadatos = {}) {
        if (!this.deberiaRegistrar('error')) return;
        this.contador++;
        const entrada = this.formatear('ERROR', mensaje, metadatos);
        console.error(`❌ [ERROR] ${mensaje}`);
        this.escribirArchivo(entrada);
    }
    /**
     * Log nivel DEBUG (solo si está habilitado)
     */
    debug(mensaje, metadatos = {}) {
        if (!this.deberiaRegistrar('debug')) return;
        this.contador++;
        const entrada = this.formatear('DEBUG', mensaje, metadatos);
        console.log(`🔍 [DEBUG] ${mensaje}`);
        this.escribirArchivo(entrada);
    }
    /**
     * Log de compilación (métrico)
     */
    compilacion(mensaje, metadatos = {}) {
        this.info(`⚙️ ${mensaje}`, {
            tipo: 'compilacion',
            ...metadatos
        });
    }
    /**
     * Log de IPC
     */
    ipc(mensaje, metadatos = {}) {
        this.info(`📨 ${mensaje}`, {
            tipo: 'ipc',
            ...metadatos
        });
    }
    /**
     * Obtener estadísticas del logger
     */
    obtenerStats() {
        return {
            totalLogs: this.contador,
            archivoActual: this.archivoActual,
            nivelMinimo: this.nivelMinimo
        };
    }
}
// Singleton
let instancia = null;
function getLogger(opciones = {}) {
    if (!instancia) {
        instancia = new LoggerPipeline(opciones);
    }
    return instancia;
}
module.exports = { LoggerPipeline, getLogger };