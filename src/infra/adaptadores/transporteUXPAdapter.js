'use strict';

const { TransporteArtefactoPort } = require('../../core/ports/transporteArtefacto');

/**
 * Adaptador de Infraestructura: Transporte UXP/IPC (C.50.1)
 * Implementa el puerto TransporteArtefactoPort para enviar el
 * artefacto canónico a Adobe InDesign mediante un canal IPC inyectado.
 */
class TransporteUXPAdapter extends TransporteArtefactoPort {
    /**
     * @param {Object} clienteIPC - Cliente inyectado para la red/IPC (debe implementar .send())
     */
    constructor(clienteIPC) {
        super();
        this.clienteIPC = clienteIPC;
    }

    /**
     * Transporta el artefacto canónico como una unidad atómica.
     * 
     * @param {Object} artefacto - El artefacto canónico { jsonOficial, xhtml, metadatos }.
     * @returns {Promise<Object>} - Resultado de la operación con el ID de transacción.
     */
    async enviar(artefacto) {
        // Validación estricta para proteger la integridad de la red (Invariante T.2)
        if (!artefacto || typeof artefacto !== 'object' || !artefacto.jsonOficial || !artefacto.xhtml || !artefacto.metadatos) {
            throw new Error("ERR_INVALID_ARTEFACTO: Se requiere un artefacto canónico C.46 válido y completo.");
        }

        if (!this.clienteIPC || typeof this.clienteIPC.send !== 'function') {
            throw new Error("ERR_IPC_CLIENT: Cliente IPC no válido o no inyectado.");
        }

        // Invariante T.3 y T.5: Empaquetar y serializar sin mutar el payload
        const envoltorio = {
            tipo: 'ARTEFACTO_C46',
            timestamp: Date.now(),
            payload: artefacto
        };

        const payloadString = JSON.stringify(envoltorio);

        try {
            // Invariante T.4: Delega la transmisión física
            const respuesta = await this.clienteIPC.send(payloadString);
            
            return {
                exito: true,
                txId: respuesta.id || 'tx_unknown'
            };
        } catch (error) {
            // Invariante T.6: Error explícito de infraestructura
            throw new Error(`ERR_TRANSPORT_FAILED: Fallo al enviar el artefacto por IPC. Detalle: ${error.message}`);
        }
    }
}

module.exports = {
    TransporteUXPAdapter
};