'use strict';

const fs = require('fs');
// Importamos la fachada pura de la Capa de Aplicación
const { ejecutarPipelineModular } = require('./pipelineModular');
// Importamos la infraestructura de salida
const { PersistenciaAdapter } = require('./infra/adaptadores/persistenciaAdapter');

/**
 * Composition Root (C.49)
 * Punto de entrada E2E para entornos Node/CLI.
 * Orquesta la entrada física, el procesamiento puro en memoria y la salida física,
 * sin contaminar el Core con infraestructura.
 *
 * @param {string} rutaEntrada - Ruta absoluta al archivo JSON crudo de entrada.
 * @param {string} rutaDestino - Ruta absoluta al directorio donde se guardarán los artefactos.
 * @param {Object} opciones - Opciones de configuración para el pipeline.
 * @returns {Object} - Resultado de la operación de persistencia.
 */
function procesarDocumentoE2E(rutaEntrada, rutaDestino, opciones = {}) {
    // 1. Infraestructura de Entrada: Leer el archivo físico (Disco -> Memoria)
    const contenidoCrudo = fs.readFileSync(rutaEntrada, 'utf8');
    const jsonCrudo = JSON.parse(contenidoCrudo);

    // 2. Capa de Aplicación Pura: Ejecutar el motor (Totalmente agnóstico al disco)
    const artefactoC46 = ejecutarPipelineModular(jsonCrudo, opciones);

    // 3. Infraestructura de Salida: Materializar en disco (Memoria -> Disco)
    const persistencia = new PersistenciaAdapter();
    const resultado = persistencia.guardar(artefactoC46, rutaDestino);

    return resultado;
}

module.exports = {
    procesarDocumentoE2E
};