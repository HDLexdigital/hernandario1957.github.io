/**
 * O3.4 — Execution Health & Liveness Contract Suite (H1–H12)
 */

'use strict';

const path = require('path');
const ExecutionHealthEngine = require(path.join(process.cwd(), 'src', 'operations', 'O3', 'ExecutionHealthEngine'));

describe('O3.4 — Execution Health & Liveness Contract Suite (H1–H12)', () => {

    let healthEngine;
    const executionId = 'EXEC_HEALTH_001';

    beforeEach(() => {
        healthEngine = new ExecutionHealthEngine(1000); // 1 segundo de ventana de frescura
    });

    test('H1, H2 & H4. IDENTITY & FRESHNESS: Registra latidos monótonos y evalúa estado LIVE dentro de ventana', () => {
        const now = Date.now();
        healthEngine.ingestHeartbeat(executionId, 0, 10, null, now);
        healthEngine.ingestHeartbeat(executionId, 1, 20, null, now + 100);

        const verdict = healthEngine.evaluateHealth(executionId, now + 200);

        expect(verdict.liveness).toBe('LIVE');
        expect(verdict.observedState).toBe('RUNNING');
        expect(verdict.lastAcceptedHeartbeat).toBe(1);
    });

    test('H6 & H8. TERMINAL DOMINANCE: Un estado terminal (CERTIFIED) prevalece absolutamente sobre cualquier latido', () => {
        const now = Date.now();
        // Envía estado terminal
        healthEngine.ingestHeartbeat(executionId, 0, 10, 'CERTIFIED', now);

        // Intenta enviar un latido posterior con estado running (simulando latido retrasado)
        healthEngine.ingestHeartbeat(executionId, 1, 15, null, now + 50);

        const verdict = healthEngine.evaluateHealth(executionId, now + 100);

        expect(verdict.observedState).toBe('CERTIFIED');
        expect(verdict.liveness).toBe('TERMINAL');
    });

    test('H10 & H11. READ-ONLY & DETERMINISM: El veredicto de salud es determinista y no muta el estado', () => {
        const now = Date.now();
        healthEngine.ingestHeartbeat(executionId, 0, 50, null, now);

        const verdictA = healthEngine.evaluateHealth(executionId, now + 100);
        const verdictB = healthEngine.evaluateHealth(executionId, now + 100);

        expect(verdictA.healthVerdictHash).toBe(verdictB.healthVerdictHash);
        expect(verdictA.liveness).toBe('LIVE');
    });

    test('H2. MONOTONIC HEARTBEAT: Rechaza latidos con secuencias retrocedidas o duplicadas', () => {
        const now = Date.now();
        healthEngine.ingestHeartbeat(executionId, 5, 50, null, now);
        
        const result = healthEngine.ingestHeartbeat(executionId, 5, 55, null, now + 50);
        expect(result.accepted).toBe(false);
        expect(result.reason).toBe('MONOTONIC_SEQUENCE_VIOLATION');
    });
});