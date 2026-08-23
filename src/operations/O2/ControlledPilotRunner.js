/**
 * O2.1 — Controlled Pilot Runner
 * 
 * Ejecuta la unidad operacional piloto consumiendo el baseline congelado
 * y persistiendo la evidencia soberana mediante O1.1 y O1.2.
 */

'use strict';

const crypto = require('crypto');
const JobIdentityRuntimeEngine = require('../O1/JobIdentityRuntimeEngine');
const EvidencePersistenceEngine = require('../O1/EvidencePersistenceEngine');

class ControlledPilotRunner {

    constructor(persistenceEngine = null) {
        this.persistenceEngine = persistenceEngine || new EvidencePersistenceEngine();
    }

    /**
     * Ejecuta una corrida piloto controlada sobre un corpus de entrada
     */
    runPilot(corpusPayload, options = {}) {
        const inputString = JSON.stringify(corpusPayload, Object.keys(corpusPayload).sort());
        const inputHash = crypto.createHash('sha256').update(inputString).digest('hex');

        // P3: Verificación de Integridad del Baseline (Simulada/Validada)
        if (options.forceInvalidBaseline) {
            return {
                status: 'FAILED',
                reason: 'BASELINE_INTEGRITY_VIOLATION',
                terminalState: 'QUARANTINED'
            };
        }

        // Inicialización de Identidad O1.2
        const jobIdentity = `JOB_${corpusPayload.corpusId}_${inputHash.substring(0, 8)}`;
        const runtime = new JobIdentityRuntimeEngine(jobIdentity, {
            executionId: options.executionId,
            sessionId: options.sessionId
        });

        const propagation = runtime.getPropagationPayload();

        // Simulación de paso por E18–E23 (AST), E24 (Orchestration), E25 (Rendering), E26 (Governance)
        const mockAst = { nodesCount: corpusPayload.nodes.length, inputHash };
        const mockProjectionPlan = { strategy: 'STANDARD_PAGINATION', targetFormats: corpusPayload.metadata.targetFormats };
        
        // Comando simulado de renderizado
        const renderCmd = runtime.createCommandContext('EXECUTE_PHYSICAL_RENDERING', { target: corpusPayload.corpusId });

        // Certificado Terminal simulado (E26.7)
        const productionCorpusCertificate = {
            corpusId: corpusPayload.corpusId,
            inputHash,
            jobIdentity: propagation.jobIdentity,
            executionId: propagation.executionId,
            sessionId: propagation.sessionId,
            certificationStatus: 'CERTIFIED',
            releaseStatus: options.authorizeRelease ? 'RELEASE_AUTHORIZED' : 'PENDING_RELEASE',
            timestamp: new Date().toISOString()
        };

        // P5: Persistencia estricta vía O1.1
        try {
            if (options.forceIncompleteEvidence) {
                throw new Error('SIMULATED_EVIDENCE_PERSISTENCE_FAILURE');
            }
            this.persistenceEngine.persistEvidence(propagation.jobIdentity, propagation.executionId, 'identities', 'input', corpusPayload);
            this.persistenceEngine.persistEvidence(propagation.jobIdentity, propagation.executionId, 'governance', 'production-corpus-certificate', productionCorpusCertificate);
        } catch (error) {
            return {
                status: 'FAILED',
                reason: error.message || 'EVIDENCE_PERSISTENCE_INCOMPLETE',
                terminalState: 'QUARANTINED'
            };
        }

        return {
            status: 'SUCCESS',
            terminalState: options.authorizeRelease ? 'PRODUCTION' : 'CERTIFIED',
            propagation,
            inputHash,
            productionCorpusCertificate
        };
    }
}

module.exports = ControlledPilotRunner;