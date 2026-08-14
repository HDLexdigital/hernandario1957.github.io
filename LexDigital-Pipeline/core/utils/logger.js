const fs = require('fs');
const path = require('path');

class Logger {
    constructor(nombreModulo) {
        this.nombreModulo = nombreModulo;
        this.nivel = process.env.LOG_LEVEL || 'info';
        this.nivelNumerico = this.obtenerNivelNumerico(this.nivel);
        
        // Crear directorio de logs si no existe
        const dirLogs = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(dirLogs)) {
            fs.mkdirSync(dirLogs, { recursive: true });
        }
        
        this.archivoLog = path.join(dirLogs, `lexdigital-${new Date().toISOString().split('T')[0]}.log`);
    }

    obtenerNivelNumerico(nivel) {
        const niveles = { debug: 0, info: 1, warn: 2, error: 3 };
        return niveles[nivel] || 1;
    }

    setNivel(nivel) {
        this.nivel = nivel;
        this.nivelNumerico = this.obtenerNivelNumerico(nivel);
    }

    formatearMensaje(nivel, mensaje, datos = {}) {
        const timestamp = new Date().toISOString();
        const datosString = Object.keys(datos).length > 0 
            ? ' ' + JSON.stringify(datos) 
            : '';
        return `[${timestamp}] [${nivel.toUpperCase()}] [${this.nombreModulo}] ${mensaje}${datosString}`;
    }

    escribirLog(nivel, mensaje, datos) {
        const mensajeFormateado = this.formatearMensaje(nivel, mensaje, datos);
        
        // Escribir en archivo
        try {
            fs.appendFileSync(this.archivoLog, mensajeFormateado + '\n');
        } catch (error) {
            console.error('Error escribiendo log:', error.message);
        }
        
        // Escribir en consola
        const color = {
            debug: '\x1b[36m',  // Cyan
            info: '\x1b[32m',   // Green
            warn: '\x1b[33m',   // Yellow
            error: '\x1b[31m'   // Red
        }[nivel] || '\x1b[0m';
        
        const reset = '\x1b[0m';
        console.log(`${color}${mensajeFormateado}${reset}`);
    }

    debug(mensaje, datos) {
        if (this.obtenerNivelNumerico('debug') >= this.nivelNumerico) {
            this.escribirLog('debug', mensaje, datos);
        }
    }

    info(mensaje, datos) {
        if (this.obtenerNivelNumerico('info') >= this.nivelNumerico) {
            this.escribirLog('info', mensaje, datos);
        }
    }

    warn(mensaje, datos) {
        if (this.obtenerNivelNumerico('warn') >= this.nivelNumerico) {
            this.escribirLog('warn', mensaje, datos);
        }
    }

    error(mensaje, datos) {
        if (this.obtenerNivelNumerico('error') >= this.nivelNumerico) {
            this.escribirLog('error', mensaje, datos);
        }
    }
}

module.exports = { Logger };