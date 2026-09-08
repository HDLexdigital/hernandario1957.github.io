/**
 * O2.4 — Production-Scale Institutional Run Contract Suite (S1–S12)
 */

'use strict';

const path = require('path');
const fs = require('fs');
const O24ProductionScaleRunner = require(path.join(process.cwd(), 'src', 'operations', 'O2', 'O24ProductionScaleRunner'));
const batchPayload = require(path.join(process.cwd(), 'src', 'operations', 'O2', 'fixtures', 'massProductionCorpusBatch.json'));

describe('O2.4 — Production-Scale Institutional Run Contract Suite', () => {

    const sandboxDir = path.join(process.cwd(), 'test-o24-sandbox');
    let runner;

    beforeEach(() => {
        if (fs.existsSync(sandboxDir)) {
            fs.rmSync(sandboxDir, { recursive: true, force: true });
        }
        const EvidencePersistenceEngine = require(path.join(process.cwd(), 'src', 'operations', 'O1', 'EvidencePersistenceEngine'));
        const persistence = new EvidencePersistenceEngine(sandboxDir);
        runner = new O24ProductionScaleRunner(persistence);
    });

    afterEach(() => {
        if (fs.existsSync(sandboxDir)) {
            fs.rmSync(sandboxDir, { recursive: true, force: true });
        }
    });

    test('S1–S6, S8–S10 & S12. CAMINO VERDE DE ESCALA: Procesa el lote masivo, aísla identidades y emite el certificado agregado hacia PRODUCTION', async () => {
        const result = await runner.runBatchProduction(batchPayload);

        expect(result.status).toBe('SUCCESS');
        expect(result.terminalState).toBe('PRODUCTION');
        expect(result.aggregateCertificate.totalUnitsProcessed).toBe(2);
        expect(result.aggregateCertificate.aggregatedStatus).toBe('PRODUCTION');
        expect(result.batchHash).toBeDefined();

        // Verifica aislamiento estricto entre unidades (S2 / S9)
        const execIdA = result.aggregateCertificate.executedJobs[0].executionId;
        const execIdB = result.aggregateCertificate.executedJobs[1].executionId;
        expect(execIdA).not.toBe(execIdB);
    });

    test('S7 & S11. FAILURE CONTAINMENT (LOTE): Un fallo en el procesamiento de escala deriva todo el lote a QUARANTINED', async () => {
        const result = await runner.runBatchProduction(batchPayload, { forceBatchFailure: true });

        expect(result.status).toBe('FAILED');
        expect(result.terminalState).toBe('QUARANTINED');
        expect(result.reason).toBe('BATCH_PROCESSING_FAILURE');
    });
});