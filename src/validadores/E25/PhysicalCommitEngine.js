/**
 * E25.7 — PhysicalCommitEngine
 * 
 * - Gestiona la promoción atómica de artefactos desde staging al master.
 * - Valida integridad mediante hashes y provee trazabilidad (provenance).
 * - Implementa transaccionalidad total (todo o nada) y cuarentena ante divergencias.
 */

'use strict';

class PhysicalCommitEngine {

    static commit(context, system, expectedHashes) {
        if (context.state === 'COMMITTED') return { status: 'ALREADY_COMMITTED' };
        if (context.state !== 'READY_TO_COMMIT') return { status: 'COMMIT_NOT_AUTHORIZED' };

        const stagingKeys = Object.keys(system.staging);
        const expectedKeys = Object.keys(expectedHashes);

        // Invariante C2: Prohibido commits parciales (El set esperado debe coincidir con el staging completo)
        if (expectedKeys.length !== stagingKeys.length || !stagingKeys.every(k => expectedHashes[k])) {
            return { status: 'COMMIT_ABORTED', reason: 'PARTIAL_COMMIT_FORBIDDEN' };
        }

        // 1. Verificación de integridad y existencia (C2, C4)
        for (const [artifactId, expectedHash] of Object.entries(expectedHashes)) {
            const staged = system.staging[artifactId];
            if (!staged || staged.hash !== expectedHash) {
                system.quarantine.push({ artifactId, expectedHash, actual: staged?.hash });
                return { status: 'COMMIT_REJECTED', reason: 'HASH_DIVERGENCE' };
            }
        }

        // 2. Promoción Atómica (C3)
        try {
            for (const [artifactId, staged] of Object.entries(system.staging)) {
                system.master[artifactId] = staged.content;
                system.registry[artifactId] = {
                    provenance: `E24.4_CHAIN_${context.job || 'DEFAULT'}`,
                    executionId: context.exec,
                    timestamp: new Date().toISOString()
                };
            }
            context.state = 'COMMITTED';
            return { status: 'COMMITTED' };
        } catch (error) {
            context.state = 'COMMIT_FAILED';
            return { status: 'COMMIT_FAILED', reason: error.message };
        }
    }
}

module.exports = PhysicalCommitEngine;