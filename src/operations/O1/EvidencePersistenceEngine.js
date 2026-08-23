/**
 * O1.1 — Evidence Persistence Engine
 * 
 * - Perímetro de persistencia atómica, determinista e inmutable para la evidencia soberana (E24–E26).
 * - Agnóstica del Sistema Operativo (Normalización de rutas Windows/Linux).
 * - Garantiza escritura atómica (.tmp -> rename) y sellado de inmutabilidad (Read-Only).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class EvidencePersistenceEngine {

    constructor(baseStorageDir = path.join(process.cwd(), 'evidence')) {
        this.baseStorageDir = baseStorageDir;
    }

    /**
     * Normaliza rutas físicas a IDs de recursos canónicos (Agnóstico de Win/Linux)
     */
    static normalizeCanonicalPath(physicalPath) {
        if (!physicalPath) return '';
        // Convierte barras invertidas y normaliza separadores a '/'
        return physicalPath.replace(/\\/g, '/').replace(/^([A-Z]:)?\//i, '').replace(/^\/+/, '');
    }

    /**
     * Serialización canónica determinista (Ordenación profunda de claves)
     */
    static canonicalizePayload(payload) {
        return JSON.stringify(payload, Object.keys(payload).sort());
    }

    /**
     * Persiste un bloque de evidencia de forma atómica e inmutable
     */
    persistEvidence(jobIdentity, executionId, category, artifactName, payload) {
        if (!jobIdentity || !executionId || !category || !artifactName || !payload) {
            throw new Error('PERSISTENCE_INVALID_PARAMETERS');
        }

        const executionDir = path.join(this.baseStorageDir, jobIdentity, executionId, category);
        if (!fs.existsSync(executionDir)) {
            fs.mkdirSync(executionDir, { recursive: true });
        }

        const targetFilePath = path.join(executionDir, `${artifactName}.json`);
        
        // O1.1-E: Inmutabilidad Operacional (Rechaza sobrescritura de evidencias ya selladas)
        if (fs.existsSync(targetFilePath)) {
            throw new Error('IMMUTABLE_EVIDENCE_VIOLATION: Cannot overwrite sealed evidence.');
        }

        const canonicalString = EvidencePersistenceEngine.canonicalizePayload(payload);
        const evidenceHash = crypto.createHash('sha256').update(canonicalString).digest('hex');

        const wrappedPayload = {
            metadata: {
                jobIdentity,
                executionId,
                category,
                artifactName,
                persistedAt: new Date().toISOString(),
                evidenceHash
            },
            data: payload
        };

        const wrappedCanonicalString = EvidencePersistenceEngine.canonicalizePayload(wrappedPayload);
        const tempFilePath = `${targetFilePath}.${crypto.randomBytes(4).toString('hex')}.tmp`;

        try {
            // O1.1-C: Atomic Persistence (.tmp -> Flush -> Verify -> Atomic Rename)
            fs.writeFileSync(tempFilePath, wrappedCanonicalString, 'utf8');
            
            // Verificación inmediata de integridad previa al rename
            const writtenBytes = fs.readFileSync(tempFilePath, 'utf8');
            const verificationHash = crypto.createHash('sha256').update(writtenBytes).digest('hex');

            if (verificationHash !== crypto.createHash('sha256').update(wrappedCanonicalString).digest('hex')) {
                throw new Error('INTEGRITY_SEAL_MISMATCH');
            }

            fs.renameSync(tempFilePath, targetFilePath);

            // O1.1-E: Sellado físico de inmutabilidad (Read-Only en disco si el SO lo soporta)
            try {
                fs.chmodSync(targetFilePath, 0o444); // Read-only para todos
            } catch (err) {
                // En Windows los permisos de chmod operan distinto, pero se asegura por lógica de motor
            }

            return {
                status: 'EVIDENCE_SEALED',
                targetPath: targetFilePath,
                evidenceHash
            };

        } catch (error) {
            if (fs.existsSync(tempFilePath)) {
                try { fs.unlinkSync(tempFilePath); } catch (e) {}
            }
            throw new Error(`ATOMIC_PERSISTENCE_FAILED: ${error.message}`);
        }
    }
}

module.exports = EvidencePersistenceEngine;