/**
 * O3.1 — Execution Registry Contract Suite
 */

'use strict';

const path = require('path');
const ExecutionRegistryEngine = require(path.join(process.cwd(), 'src', 'operations', 'O3', 'ExecutionRegistryEngine'));

describe('O3.1 — Execution Registry Contract Suite', () => {

    let registry;

    beforeEach(() => {
        registry = new ExecutionRegistryEngine();
    });

    test('O3.1-A. REGISTRY INDEXING: Registra y direcciona metadatos operacionales correctamente', () => {
        const entry = registry.registerExecution({
            executionId: 'EXEC_ABC_123',
            jobIdentity: 'JOB_TEST_REGISTRY',
            sessionId: 'SES_001',
            inputHash: 'sha256_fake_hash',
            status: 'PRODUCTION'
        });

        expect(entry.executionId).toBe('EXEC_ABC_123');
        expect(entry.evidenceLocation).toContain('JOB_TEST_REGISTRY/EXEC_ABC_123');
    });

    test('O3.1-B. ADDRESSABILITY & DISCOVERABILITY: Permite búsqueda exacta por executionId y filtrado por jobIdentity', () => {
        registry.registerExecution({ executionId: 'EXEC_001', jobIdentity: 'JOB_A', status: 'CERTIFIED' });
        registry.registerExecution({ executionId: 'EXEC_002', jobIdentity: 'JOB_A', status: 'PRODUCTION' });
        registry.registerExecution({ executionId: 'EXEC_003', jobIdentity: 'JOB_B', status: 'QUARANTINED' });

        const found = registry.lookup('EXEC_002');
        expect(found.status).toBe('PRODUCTION');

        const jobAEntries = registry.findByJob('JOB_A');
        expect(jobAEntries.length).toBe(2);
    });

    test('O3.1-C. RIGOR DE ENTRADA: Rechaza registros huérfanos sin jobIdentity o executionId', () => {
        expect(() => {
            registry.registerExecution({ status: 'CREATED' });
        }).toThrow('INVALID_REGISTRY_ENTRY');
    });
});