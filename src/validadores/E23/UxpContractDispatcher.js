/**
 * E23.1 — UxpContractDispatcher (Despachador de Protocolo UXP / IPC)
 * 
 * - Valida la integridad de las peticiones IPC procedentes del entorno editorial de InDesign UXP.
 * - Rechaza contratos malformados lanzando UXP_CONTRACT_VIOLATION.
 * - Clasifica operaciones no soportadas mediante códigos de error tipificados.
 * - Retorna un objeto de respuesta estructurado y garantiza inmutabilidad.
 */

'use strict';

/**
 * Aplica congelamiento profundo recursivo para garantizar inmutabilidad.
 * @private
 */
function deepFreeze(obj) {
    if (obj && typeof obj === 'object') {
        if (!Object.isFrozen(obj)) {
            Object.freeze(obj);
        }
        Object.getOwnPropertyNames(obj).forEach(prop => {
            deepFreeze(obj[prop]);
        });
    }
    return obj;
}

class UxpContractDispatcher {
    /**
     * Procesa y despacha una solicitud del protocolo UXP.
     * @param {Object} request - Solicitud entrante.
     * @returns {Object} Respuesta tipificada.
     */
    static dispatch(request) {
        if (!request || typeof request !== 'object') {
            throw new Error('UXP_CONTRACT_VIOLATION: La solicitud debe ser un objeto válido.');
        }

        const { requestId, protocolVersion, operation, payload } = request;

        // Validación de campos estructurales obligatorios
        if (!requestId || !operation) {
            throw new Error('UXP_CONTRACT_VIOLATION: requestId y operation son campos obligatorios en el protocolo.');
        }

        const supportedOperations = ['COMPILE_AST', 'VALIDATE_PROJECT', 'EXPORT_TARGET'];

        if (!supportedOperations.includes(operation)) {
            return deepFreeze({
                requestId: requestId,
                protocolVersion: protocolVersion || '1.0.0',
                status: 'ERROR',
                error: {
                    code: 'UNSUPPORTED_OPERATION',
                    message: `La operación '${operation}' no está tipificada en el protocolo E23.`
                },
                data: null
            });
        }

        // Operación exitosa simulada bajo contrato
        return deepFreeze({
            requestId: requestId,
            protocolVersion: protocolVersion || '1.0.0',
            status: 'SUCCESS',
            error: null,
            data: {
                processedOperation: operation,
                receivedPayloadKeys: payload ? Object.keys(payload) : []
            }
        });
    }
}

module.exports = UxpContractDispatcher;