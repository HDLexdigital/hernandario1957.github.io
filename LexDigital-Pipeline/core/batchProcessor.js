'use strict';
/**
 * Procesador por lotes para LexDigital Pipeline
 * Permite procesar múltiples documentos en paralelo
 */
const fs = require('fs');
const path = require('path');
class BatchProcessor {
    constructor(opciones = {}) {
        this.maxConcurrentes = opciones.maxConcurrentes || 3;
        this.directorioEntrada = opciones.directorioEntrada || './documentos';
        this.directorioSalida = opciones.directorioSalida || './salidas';
        this.resultados = [];
        this.errores = [];
        this.logger = null;
    }
    setLogger(logger) {
        this.logger = logger;
    }
    log(mensaje, tipo = 'info') {
        if (this.logger) {
            this.logger[tipo](mensaje);
        } else {
            console.log(`✅ ${mensaje}`);
        }
    }
    /**
     * Procesa un lote de documentos
     * @param {Array} documentos - Lista de documentos a procesar
     * @param {Function} funcionProcesamiento - Función async que procesa cada doc
     */
    async procesarLote(documentos, funcionProcesamiento) {
        const resultados = [];
        const errores = [];
        const inicio = Date.now();
        this.log(`Iniciando procesamiento batch: ${documentos.length} documentos`);
        // Procesar en grupos
        for (let i = 0; i < documentos.length; i += this.maxConcurrentes) {
            const lote = documentos.slice(i, i + this.maxConcurrentes);
            const numeroLote = Math.floor(i / this.maxConcurrentes) + 1;
            const totalLotes = Math.ceil(documentos.length / this.maxConcurrentes);
            this.log(`Procesando lote ${numeroLote}/${totalLotes} (${lote.length} documentos)`);
            const promesas = lote.map(async (doc, index) => {
                try {
                    const resultado = await funcionProcesamiento(doc);
                    return { 
                        exito: true, 
                        documento: doc,
                        resultado: resultado,
                        indice: i + index
                    };
                } catch (error) {
                    return { 
                        exito: false, 
                        documento: doc,
                        error: error.message,
                        indice: i + index
                    };
                }
            });
            const resultadosLote = await Promise.all(promesas);
            for (const resultado of resultadosLote) {
                if (resultado.exito) {
                    resultados.push(resultado);
                    this.log(`✅ Documento ${resultado.indice + 1} procesado correctamente`);
                } else {
                    errores.push(resultado);
                    this.log(`❌ Documento ${resultado.indice + 1} falló: ${resultado.error}`, 'warn');
                }
            }
        }
        const tiempoTotal = Date.now() - inicio;
        const resumen = {
            totalDocumentos: documentos.length,
            exitosos: resultados.length,
            fallidos: errores.length,
            tiempoTotal: tiempoTotal,
            tiempoPromedio: resultados.length > 0 ? Math.round(tiempoTotal / resultados.length) : 0,
            resultados: resultados,
            errores: errores
        };
        this.log(`Batch completado: ${resultados.length}/${documentos.length} exitosos en ${tiempoTotal}ms`);
        return resumen;
    }
    /**
     * Procesa archivos JSON desde un directorio
     */
    async procesarDirectorio(funcionProcesamiento) {
        if (!fs.existsSync(this.directorioEntrada)) {
            throw new Error(`Directorio no existe: ${this.directorioEntrada}`);
        }
        const archivos = fs.readdirSync(this.directorioEntrada)
            .filter(f => f.endsWith('.json'))
            .map(f => path.join(this.directorioEntrada, f));
        this.log(`Encontrados ${archivos.length} archivos JSON`);
        const documentos = archivos.map(archivo => {
            try {
                return JSON.parse(fs.readFileSync(archivo, 'utf-8'));
            } catch (e) {
                this.log(`Error leyendo ${archivo}: ${e.message}`, 'warn');
                return null;
            }
        }).filter(d => d !== null);
        return this.procesarLote(documentos, funcionProcesamiento);
    }
    /**
     * Guarda resultados en archivos
     */
    guardarResultados(resumen) {
        if (!fs.existsSync(this.directorioSalida)) {
            fs.mkdirSync(this.directorioSalida, { recursive: true });
        }
        const archivoResumen = path.join(this.directorioSalida, 'batch_resumen.json');
        fs.writeFileSync(archivoResumen, JSON.stringify({
            timestamp: new Date().toISOString(),
            ...resumen
        }, null, 2), 'utf-8');
        this.log(`Resumen guardado en: ${archivoResumen}`);
        return archivoResumen;
    }
}
module.exports = BatchProcessor;