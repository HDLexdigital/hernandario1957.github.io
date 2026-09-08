// src/core/cadenaCustodia.js
const crypto = require('crypto');

class CadenaCustodia {
    constructor(jobId) {
        this.jobId = jobId;
        this.registro = [];
        this.hashAcumulado = this.hashInicial(jobId);
    }
    
    hashInicial(jobId) {
        return crypto
            .createHash('sha256')
            .update(`job:${jobId}:inicio`)
            .digest('hex');
    }
    
    registrar(evento, metadatos = {}) {
        const entrada = {
            secuencia: this.registro.length + 1,
            timestamp: new Date().toISOString(),
            evento: evento,
            metadatos: metadatos,
            hashAnterior: this.hashAcumulado
        };
        
        // Hash determinista (sin PID, rutas locales, ni timestamps variables)
        const contenidoCanonico = JSON.stringify({
            jobId: this.jobId,
            secuencia: entrada.secuencia,
            evento: evento,
            metadatos: this.normalizar(metadatos)
        });
        
        this.hashAcumulado = crypto
            .createHash('sha256')
            .update(this.hashAcumulado + contenidoCanonico)
            .digest('hex');
        
        this.registro.push({
            ...entrada,
            hash: this.hashAcumulado
        });
        
        return this.hashAcumulado;
    }
    
    normalizar(objeto) {
        // Eliminar claves no deterministas
        const clavesIgnoradas = ['pid', 'rutaAbsoluta', 'timestamp', 'fecha'];
        const resultado = {};
        
        for (const [clave, valor] of Object.entries(objeto)) {
            if (!clavesIgnoradas.includes(clave)) {
                resultado[clave] = valor;
            }
        }
        
        return resultado;
    }
    
    obtenerCadena() {
        return {
            jobId: this.jobId,
            hashFinal: this.hashAcumulado,
            totalEventos: this.registro.length,
            registro: this.registro
        };
    }
}

module.exports = CadenaCustodia;