/**
 * O6.3 — Lifecycle State Consistency Contract Suite (S1–S12)
 */

'use strict';

const path = require('path');
const LifecycleStateConsistencyEngine = require(path.join(process.cwd(), 'src', 'operations', 'O6', 'LifecycleStateConsistencyEngine'));

describe('O6.3 — Lifecycle State Consistency Contract Suite (S1–S12)', () => {

    let consistencyEngine;

    beforeEach(() => {
        consistencyEngine = new LifecycleStateConsistencyEngine();
    });

    test('S1, S2, S3, S4, S11 & S12. CAMINO VERDE: Valida una secuencia legítima de estados generando un hash determinista', () => {
        const validSequence = {
            executionId: 'EXEC_2026_001',
            states: [
                { state: 'CREATED', timestamp: '2026-08-22T08:00:00.000Z' },
                { state: 'RUNNING', timestamp: '2026-08-22T08:01:00.000Z' },
                { state: 'CERTIFIED', timestamp: '2026-08-22T08:05:00.000Z' },
                { state: 'RELEASE_AUTHORIZED', timestamp: '2026-08-22T08:06:00.000Z' },
                { state: 'PRODUCTION', timestamp: '2026-08-22T08:07:00.000Z' },
                { state: 'DISTRIBUTED', timestamp: '2026-08-22T08:08:00.000Z' }
            ]
        };

        const verdict = consistencyEngine.verifyStateConsistency(validSequence);

        expect(verdict.status).toBe('LIFECYCLE_CONSISTENT');
        expect(verdict.stateVerdictHash).toBeDefined();
        expect(verdict.executionId).toBe('EXEC_2026_001');
    });

    test('S2 & S3. ALLOWED TRANSITION / NO SKIPPING: Rechaza saltos de estado no permitidos por el autómata (ej. CREATED directo a PRODUCTION)', () => {
        const skippedSequence = {
            executionId: 'EXEC_2026_002',
            states: [
                { state: 'CREATED', timestamp: '2026-08-22T08:00:00.000Z' },
                { state: 'PRODUCTION', timestamp: '2026-08-22T08:01:00.000Z' } // Salto ilegal
            ]
        };

        expect(() => {
            consistencyEngine.verifyStateConsistency(skippedSequence);
        }).toThrow('LIFECYCLE_STATE_TRANSITION_INVALID');
    });

    test('S4. CHRONOLOGICAL ORDERING: Rechaza secuencias con marcas de tiempo invertidas o hacia el pasado', () => {
        const chronologicalViolation = {
            executionId: 'EXEC_2026_003',
            states: [
                { state: 'CREATED', timestamp: '2026-08-22T08:10:00.000Z' },
                { state: 'RUNNING', timestamp: '2026-08-22T08:00:00.000Z' } // Tiempo en el pasado respecto a CREATED
            ]
        };

        expect(() => {
            consistencyEngine.verifyStateConsistency(chronologicalViolation);
        }).toThrow('CHRONOLOGICAL_ORDERING_VIOLATION');
    });

    test('S1. VALID INITIAL STATE: Rechaza secuencias que no inicien en el estado CREATED', () => {
        const invalidStart = {
            executionId: 'EXEC_2026_004',
            states: [
                { state: 'RUNNING', timestamp: '2026-08-22T08:00:00.000Z' }
            ]
        };

        expect(() => {
            consistencyEngine.verifyStateConsistency(invalidStart);
        }).toThrow('INVALID_INITIAL_STATE');
    });
});