'use strict';

const fs = require('fs');
// Importamos la fachada pura de la Capa de Aplicación
const { ejecutarPipelineModular } = require('./pipelineModular');
// Importamos la infraestructura de salida
const { PersistenciaAdapter } = require('./infra/adaptadores/persistenciaAdapter');
const { TransporteUXPAdapter } = require('./infra/adaptadores/transporteUXPAdapter');

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
    return persistencia.guardar(artefactoC46, rutaDestino);
}

/**
 * Composition Root para UXP/IPC (C.50.5)
 * Punto de entrada para el flujo directo desde Adobe InDesign.
 * Orquesta el pipeline puro en memoria y transporta el artefacto a través del canal IPC inyectado.
 *
 * @param {Object} jsonCrudo - Objeto JSON en memoria (enviado desde InDesign).
 * @param {Object} clienteIPC - Cliente o canal de comunicación inyectado (mock o real).
 * @param {Object} opciones - Opciones de configuración.
 * @returns {Promise<Object>} - Resultado de la operación de transporte.
 */
async function procesarDocumentoIPC(jsonCrudo, clienteIPC, opciones = {}) {
    // 1. Capa de Aplicación Pura: Ejecutar el motor (Agnóstico a InDesign/UXP)
    const artefactoC46 = ejecutarPipelineModular(jsonCrudo, opciones);

    // 2. Infraestructura de Salida: Transportar vía IPC (Memoria -> Red/UXP)
    const transporte = new TransporteUXPAdapter(clienteIPC);
    return await transporte.enviar(artefactoC46);
}

module.exports = {
    procesarDocumentoE2E,
    procesarDocumentoIPC
};