'use strict';

/**
 * Puerto de Salida: Transporte del Artefacto Canónico (C.50.0)
 * Define la interfaz abstracta para enviar el artefacto a consumidores externos
 * (ej. Adobe InDesign vía UXP, WebSockets, HTTP, etc.), manteniendo al Core
 * completamente aislado de los protocolos de red y comunicación.
 */
class TransporteArtefactoPort {
    /**
     * Transporta el artefacto canónico como una unidad atómica.
     * 
     * @param {Object} artefacto - El artefacto canónico { jsonOficial, xhtml, metadatos }.
     * @param {Object} opcionesTransporte - Configuración opcional específica del canal (inyectada por el Composition Root).
     * @returns {Object} - Resultado de la operación (éxito, identificador de entrega, etc.).
     */
    enviar(artefacto, opcionesTransporte = {}) {
        throw new Error("ERR_PORT_NOT_IMPLEMENTED: El puerto TransporteArtefactoPort debe ser implementado por un adaptador de infraestructura.");
    }
}

module.exports = {
    TransporteArtefactoPort
};