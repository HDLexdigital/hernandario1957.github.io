/**
 * O3.1 — Execution Registry Engine
 * 
 * - Actúa como el índice operacional de ejecuciones.
 * - Localiza y direcciona la evidencia soberana de O1.1 sin mutarla ni duplicarla.
 */

'use strict';

class ExecutionRegistryEngine {

    constructor() {
        this.registryStore = new Map(); // Almacén indexado en memoria (o respaldado por O1.1)
    }

    /**
     * Registra o indexa una ejecución activa o finalizada
     */
    registerExecution(executionMetadata) {
        const { executionId, jobIdentity, sessionId, inputHash, status } = executionMetadata;

        if (!executionId || !jobIdentity) {
            throw new Error('INVALID_REGISTRY_ENTRY: executionId and jobIdentity are mandatory.');
        }

        const record = {
            executionId,
            jobIdentity,
            sessionId: sessionId || 'SES_UNBOUND',
            inputHash: inputHash || 'UNKNOWN_HASH',
            status: status || 'CREATED',
            registeredAt: new Date().toISOString(),
            evidenceLocation: `evidence/${jobIdentity}/${executionId}/`
        };

        this.registryStore.set(executionId, Object.freeze(record));
        return Object.freeze(record);
    }

    /**
     * O3.1 & O3.2: Localiza metadatos de ejecución indexados
     */
    lookup(executionId) {
        if (!this.registryStore.has(executionId)) {
            throw new Error(`EXECUTION_NOT_FOUND: No registry record for executionId ${executionId}`);
        }
        return this.registryStore.get(executionId);
    }

    /**
     * Lista todas las ejecuciones asociadas a un jobIdentity específico
     */
    findByJob(jobIdentity) {
        const results = [];
        for (const record of this.registryStore.values()) {
            if (record.jobIdentity === jobIdentity) {
                results.push(record);
            }
        }
        return Object.freeze(results);
    }
}

module.exports = ExecutionRegistryEngine;