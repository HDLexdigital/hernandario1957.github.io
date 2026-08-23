/**
 * O1.2 — Production Job Identity & Runtime Engine
 * 
 * - Gestiona la emisión, jerarquía y propagación de identidades (jobIdentity, executionId, sessionId, commandId).
 * - Garantiza aislamiento, inmutabilidad y blindaje frente al ruido del runtime (J1–J7).
 */

'use strict';

const crypto = require('crypto');

class JobIdentityRuntimeEngine {

    constructor(jobIdentity, options = {}) {
        if (!jobIdentity || typeof jobIdentity !== 'string') {
            throw new Error('INVALID_JOB_IDENTITY: jobIdentity must be a valid non-empty string.');
        }
        // J1: Job Identity Stability
        this.jobIdentity = jobIdentity.trim();
        
        // J2: Execution Isolation (Un executionId único por instancia de corrida)
        this.executionId = options.executionId || `EXEC_${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
        
        // J3: Session Binding
        this.sessionId = options.sessionId || `SES_${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
        
        this.commands = [];
        
        // J7: Identity Immutability (Congelamiento de propiedades estructurales)
        Object.freeze(this);
    }

    /**
     * J4: Command Correlation (Genera y vincula un commandId unívoco a la sesión)
     */
    createCommandContext(commandType, payloadMetadata = {}) {
        const commandId = `CMD_${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
        
        // J6: Runtime Noise Isolation (Filtra metadatos de entorno/tiempo indeseados)
        const sanitizedMetadata = this._stripRuntimeNoise(payloadMetadata);

        const commandContext = {
            jobIdentity: this.jobIdentity,
            executionId: this.executionId,
            sessionId: this.sessionId,
            commandId,
            commandType,
            metadata: sanitizedMetadata,
            createdAt: new Date().toISOString() // Solo para registro histórico, no participa en hashes canónicos
        };

        this.commands.push(commandId);
        return Object.freeze(commandContext);
    }

    /**
     * J5: Identity Propagation Package
     */
    getPropagationPayload() {
        return Object.freeze({
            jobIdentity: this.jobIdentity,
            executionId: this.executionId,
            sessionId: this.sessionId,
            totalCommandsTracked: this.commands.length
        });
    }

    /**
     * J6: Elimina ruido de runtime (PID, hostname, paths absolutos de SO)
     */
    _stripRuntimeNoise(metadata) {
        const clean = { ...metadata };
        delete clean.pid;
        delete clean.hostname;
        delete clean.uptime;
        delete clean.absolutePath; // Se prefiere canonicalResourceId
        return clean;
    }
}

module.exports = JobIdentityRuntimeEngine;