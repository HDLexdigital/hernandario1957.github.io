/**
 * src/errores/LexDigitalContractError.js
 * Implementación estricta del Contrato C01-05
 */

class LexDigitalContractError extends Error {
    constructor(opciones) {
        if (!opciones || !opciones.code || !opciones.contractId || !opciones.contractVersion) {
            throw new Error("Violación de implementación: LexDigitalContractError requiere code, contractId y contractVersion.");
        }
        
        super(opciones.message || `Error contractual: ${opciones.code}`);
        this.name = "LexDigitalContractError";
        this.code = opciones.code;
        this.contractId = opciones.contractId;
        this.contractVersion = opciones.contractVersion;
        this.details = opciones.details || {};
        this.timestamp = new Date().toISOString();

        // Mantiene la traza nativa limpia
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, LexDigitalContractError);
        }
    }

    // Facilita la serialización para auditoría / logs systemd / Electron
    toJSON() {
        return {
            name: this.name,
            code: this.code,
            contractId: this.contractId,
            contractVersion: this.contractVersion,
            message: this.message,
            details: this.details,
            timestamp: this.timestamp
        };
    }
}

module.exports = { LexDigitalContractError };
