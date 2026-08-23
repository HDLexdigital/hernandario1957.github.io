/**
 * E24.5.1 — HostReadinessEngine
 * 
 * - Lanza una sonda IPC (simulada aquí mediante inyección de función).
 * - Valida estructura (malformed), liveness, timeouts, compatibilidad de versión y protocolo.
 * - Garantiza observabilidad (cero mutaciones).
 * - Aísla telemetría de los resultados contractuales lógicos (READY / NOT_READY).
 */

'use strict';

class HostReadinessEngine {
    /**
     * Evalúa si el host físico es apto para inicializar una sesión editorial.
     * @param {Object} context - { jobIdentity, executionId, requirements }
     * @param {Function} probeFn - Función asíncrona inyectada que ejecuta el IPC ping hacia UXP.
     * @returns {Object} Reporte contractual determinista.
     */
    static async probe(context, probeFn) {
        if (!context || !context.jobIdentity || !context.executionId || !context.requirements) {
            throw new Error('HOST_READINESS_VIOLATION: Contexto de ejecución inválido.');
        }

        const report = {
            contract: "E24.5.1",
            status: "NOT_READY",
            reason: null,
            jobIdentity: context.jobIdentity,
            executionId: context.executionId,
            host: null,
            readiness: {
                liveness: false,
                compatibleVersion: false,
                protocolCompatible: false
            },
            telemetry: {
                timestamp: new Date().toISOString(),
                latencyMs: 0
            }
        };

        const startTime = Date.now();
        let rawResponse;

        // 1. Liveness & Timeout
        try {
            rawResponse = await probeFn();
            report.readiness.liveness = true;
        } catch (error) {
            report.telemetry.latencyMs = Date.now() - startTime;
            if (error.message.includes('TIMEOUT')) {
                report.reason = 'HOST_READINESS_TIMEOUT';
            } else {
                report.reason = 'HOST_UNAVAILABLE';
            }
            return report;
        }

        report.telemetry.latencyMs = Date.now() - startTime;

        // 2. Malformed Response
        if (!rawResponse || typeof rawResponse !== 'object' || !rawResponse.application || !rawResponse.version || !rawResponse.protocol) {
            report.reason = 'HOST_MALFORMED_RESPONSE';
            return report;
        }

        report.host = {
            application: rawResponse.application,
            version: rawResponse.version,
            environment: rawResponse.environment,
            protocol: rawResponse.protocol
        };

        // 3. Protocol Mismatch
        if (rawResponse.protocol !== context.requirements.protocol) {
            report.reason = 'HOST_PROTOCOL_MISMATCH';
            return report;
        }
        report.readiness.protocolCompatible = true;

        // 4. Compatibility (Application & Version)
        if (rawResponse.application !== context.requirements.application || rawResponse.version < context.requirements.minVersion) {
            report.reason = 'HOST_NOT_COMPATIBLE';
            return report;
        }
        report.readiness.compatibleVersion = true;

        // 5. Zero Mutation Rule (Observacionalidad pura)
        if (rawResponse.mutations !== undefined && rawResponse.mutations > 0) {
            report.reason = 'HOST_STATE_MUTATED_DURING_PROBE';
            return report;
        }

        // 6. Veredicto Final
        report.status = 'READY';
        return report;
    }
}

module.exports = HostReadinessEngine;