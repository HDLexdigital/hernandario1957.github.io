'use strict';

/**
 * Puerto de Salida: Persistencia del Artefacto Canónico (C.48.0)
 * Define la interfaz abstracta que cualquier adaptador de infraestructura de almacenamiento
 * debe cumplir, manteniendo al Core totalmente desacoplado del sistema de archivos.
 */
class PersistenciaArtefactoPort {
    /**
     * Almacena el artefacto canónico C.46 en el destino indicado.
     * 
     * @param {Object} artefacto - El artefacto canónico { jsonOficial, xhtml, metadatos }.
     * @param {string} rutaDestino - Directorio o ruta base donde se materializarán los recursos.
     * @returns {Object} - Resultado de la operación con rutas de salida y estado.
     */
    guardar(artefacto, rutaDestino) {
        throw new Error("ERR_PORT_NOT_IMPLEMENTED: El puerto PersistenciaArtefactoPort debe ser implementado por un adaptador de infraestructura.");
    }
}

module.exports = {
    PersistenciaArtefactoPort
};