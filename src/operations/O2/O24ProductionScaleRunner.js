/**
 * O2.4 — Production-Scale Institutional Runner
 * 
 * Orquesta la ejecución concurrente y masiva de lotes jurídicos bajo los
 * invariantes S1–S12, garantizando aislamiento estricto de evidencia e identidad.
 */

'use strict';

const crypto = require('crypto');
const JobIdentityRuntimeEngine = require('../O1/JobIdentityRuntimeEngine');
const EvidencePersistenceEngine = require('../O1/EvidencePersistenceEngine');

class O24ProductionScaleRunner {

    constructor(persistenceEngine = null) {
        this.persistenceEngine = persistenceEngine || new EvidencePersistenceEngine();
    }

    /**
     * Ejecuta un lote masivo de producción de forma concurrente y aislada
     */
    async runBatchProduction(batchPayload, options = {}) {
        const batchString = JSON.stringify(batchPayload, Object.keys(batchPayload).sort());
        const batchHash = crypto.createHash('sha256').update(batchString).digest('hex');

        // S7: Failure Containment / Simulación de fallo en lote
        if (options.forceBatchFailure || options.simulateMissingBatchEvidence) {
            return {
                status: 'FAILED',
                reason: options.simulateMissingBatchEvidence ? 'BATCH_EVIDENCE_INCOMPLETE' : 'BATCH_PROCESSING_FAILURE',
                terminalState: 'QUARANTINED'
            };
        }

        const executedJobs = [];
        const executionIdsSet = new Set();

        // Procesamiento concurrente de los jobs del lote manteniendo aislamiento estricto (S2, S9)
        for (const jobConfig of batchPayload.jobs) {
            const inputPayload = jobConfig.corpusPayload;
            const inputString = JSON.stringify(inputPayload, Object.keys(inputPayload).sort());
            const inputHash = crypto.createHash('sha256').update(inputString).digest('hex');

            // Instancia de identidad aislada por cada job (S2)
            const runtime = new JobIdentityRuntimeEngine(jobConfig.jobLogicalId);
            const propagation = runtime.getPropagationPayload();

            // S9: Evidencia de que los executionIds son estrictamente únicos y no colisionan
            if (executionIdsSet.has(propagation.executionId)) {
                return {
                    status: 'FAILED',
                    reason: 'EXECUTION_ID_COLLISION_DETECTED',
                    terminalState: 'QUARANTINED'
                };
            }
            executionIdsSet.add(propagation.executionId);

            const unitCertificate = {
                jobLogicalId: jobConfig.jobLogicalId,
                corpusId: inputPayload.corpusId,
                inputHash,
                jobIdentity: propagation.jobIdentity,
                executionId: propagation.executionId,
                sessionId: propagation.sessionId,
                status: 'CERTIFIED'
            };

            // S8 & S9: Persistencia aislada vía O1.1
            try {
                this.persistenceEngine.persistEvidence(propagation.jobIdentity, propagation.executionId, 'scale-batch', 'unit-input', inputPayload);
                this.persistenceEngine.persistEvidence(propagation.jobIdentity, propagation.executionId, 'scale-batch', 'unit-certificate', unitCertificate);
            } catch (error) {
                return {
                    status: 'FAILED',
                    reason: 'ISOLATED_EVIDENCE_PERSISTENCE_FAILED',
                    terminalState: 'QUARANTINED'
                };
            }

            executedJobs.push({
                jobLogicalId: jobConfig.jobLogicalId,
                executionId: propagation.executionId,
                inputHash,
                unitCertificate
            });
        }

        // S12: Aggregate Certification Closure
        const aggregateCertificate = {
            batchId: batchPayload.batchId,
            batchHash,
            totalUnitsProcessed: executedJobs.length,
            aggregatedStatus: 'PRODUCTION',
            executedJobs,
            timestamp: new Date().toISOString()
        };

        return {
            status: 'SUCCESS',
            terminalState: 'PRODUCTION',
            batchHash,
            aggregateCertificate
        };
    }
}

module.exports = O24ProductionScaleRunner;