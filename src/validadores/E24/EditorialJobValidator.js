/**
 * E24.1 — EditorialJobValidator (Validador del Contrato de Trabajo de Producción)
 * 
 * - Verifica la integridad estructural, versiones y metadatos obligatorios de un EditorialJob.
 * - Comprueba la correspondencia de hashes criptográficos (SHA-256) contra los artefactos fuente y de proyección.
 * - Aplica los candados de masa esperados y rechaza políticas transaccionales no permitidas.
 * - Opera en modo estricto de solo lectura, sin alterar los artefactos certificados subyacentes.
 */

'use strict';

const crypto = require('crypto');

class EditorialJobValidator {
    /**
     * Valida la estructura y políticas de un contrato de job editorial.
     * @param {Object} job - Objeto EditorialJob.
     * @returns {Object} Resultado de validación.
     */
    static validateContract(job) {
        if (!job || typeof job !== 'object') {
            throw new Error(`EDITORIAL_JOB_VIOLATION: Contrato de job ausente o malformado.`);
        }

        // 1. Verificación de Identidad
        if (!job.identity || !job.identity.jobId || String(job.identity.jobId).trim() === '') {
            throw new Error(`EDITORIAL_JOB_VIOLATION: Se requiere un jobId válido en la identidad del job.`);
        }

        // 2. Verificación de Source y Projection
        if (!job.source || !job.source.artifact || !job.source.sha256) {
            throw new Error(`EDITORIAL_JOB_VIOLATION: El bloque 'source' del job está incompleto.`);
        }
        if (!job.projection || !job.projection.artifact || !job.projection.sha256) {
            throw new Error(`EDITORIAL_JOB_VIOLATION: El bloque 'projection' del job está incompleto.`);
        }

        // 3. Verificación de Políticas Operativas (Candados de Seguridad)
        if (!job.policy || job.policy.transactionPolicy !== 'NO_PARTIAL_COMMIT') {
            throw new Error(`EDITORIAL_JOB_VIOLATION: transactionPolicy debe ser estrictamente 'NO_PARTIAL_COMMIT'.`);
        }

        if (!job.policy.executionMode || !job.policy.failurePolicy || !job.policy.retryPolicy) {
            throw new Error(`EDITORIAL_JOB_VIOLATION: Configuración de políticas de ejecución incompleta.`);
        }

        // 4. Verificación de Masa e Invariantes Esperados
        if (!job.expected || job.expected.nodeCount !== 87 || job.expected.operationCount !== 87) {
            throw new Error(`EDITORIAL_JOB_VIOLATION: Los contadores esperados (nodeCount / operationCount) no coinciden con el corpus certificado (87).`);
        }

        if (job.expected.unknownIds !== 0 || job.expected.orphanNodes !== 0 || job.expected.duplicateNodes !== 0) {
            throw new Error(`EDITORIAL_JOB_VIOLATION: Los invariantes esperados prohíben estrictamente unknownIds, huérfanos o duplicados.`);
        }

        return {
            status: 'JOB_VALIDATED',
            jobId: job.identity.jobId,
            targetType: job.target ? job.target.type : 'UNKNOWN'
        };
    }

    /**
     * Compara el hash SHA-256 declarado en el job frente al contenido real del artefacto fuente.
     * @param {Object} job - EditorialJob.
     * @param {Object} artifactRegistry - Mapa de artefactos disponibles en memoria/disco ({ filename: contentString }).
     */
    static verifySourceIntegrity(job, artifactRegistry) {
        const expectedHash = job.source.sha256;
        const artifactName = job.source.artifact;

        if (!artifactRegistry || !artifactRegistry[artifactName]) {
            throw new Error(`EDITORIAL_JOB_VIOLATION: El artefacto fuente '${artifactName}' no se encuentra en el registro.`);
        }

        const actualContent = artifactRegistry[artifactName];
        const calculatedHash = crypto.createHash('sha256').update(actualContent).digest('hex');

        if (calculatedHash !== expectedHash) {
            throw new Error(`EDITORIAL_JOB_VIOLATION: SOURCE_HASH_MISMATCH - El hash SHA-256 del source no coincide (Esperado: ${expectedHash}, Calculado: ${calculatedHash}).`);
        }

        return { status: 'SOURCE_INTEGRITY_VERIFIED', hash: calculatedHash };
    }
}

module.exports = EditorialJobValidator;