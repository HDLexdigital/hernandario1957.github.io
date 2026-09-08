/**
 * E24.5.3 — Heartbeat & Liveness Contract Suite
 * 
 * Fase: RED / IMPLEMENTATION
 * 
 * Contrato de Supervivencia de Sesión Física:
 * - 1. VALID HEARTBEAT: Un latido válido mantiene el estado ALIVE.
 * - 2 & 3. IDENTITY BINDING: Latidos con sessionId o executionId incorrectos son RECHAZADOS.
 * - 4. MONOTONIC SEQUENCE: Solo se aceptan latidos con secuencia superior estricta.
 * - 5. IDEMPOTENCE: Latidos duplicados son ignorados de forma segura sin alterar estado.
 * - 6. LIVENESS THRESHOLD: Silencio mayor al threshold transiciona la sesión a TIMED_OUT.
 * - 7. TERMINALITY: TIMED_OUT es irreversible; rechaza latidos póstumos.
 * - 8. IDEMPOTENT RECOVERY: Múltiples evaluaciones de timeout no duplican la derivación a E24.3.
 * - 9. BLOCK COMMIT: TIMED_OUT prohíbe explícitamente la confirmación de operaciones.
 * - 10 & 11. RECOVERY HANDOFF: La derivación a E24.3 preserva jobIdentity y exige nueva ejecución física.
 * - 12. TELEMETRY EXCLUSION: El timestamp es efímero y no corrompe la identidad inmutable del tracker.
 */

'use strict';

const HeartbeatEngine = require('../../../src/validadores/E24/HeartbeatEngine');

describe('E24.5.3 — Heartbeat & Liveness Contract', () => {

    const mockSession = Object.freeze({
        jobIdentity: 'JOB_LEX_ALPHA',
        executionId: 'EXEC_001',
        sessionId: 'SESSION_PHYS_999'
    });

    let tracker;
    let clock;

    beforeEach(() => {
        clock = 100000; // Reloj simulado (ms)
        tracker = HeartbeatEngine.initializeTracker(mockSession, { now: clock, livenessThresholdMs: 3000 });
    });

    test('1. VALID HEARTBEAT: Heartbeat válido mantiene ALIVE y actualiza reloj', () => {
        clock += 1000;
        const hb = { sessionId: 'SESSION_PHYS_999', executionId: 'EXEC_001', sequence: 1 };
        
        const result = HeartbeatEngine.processHeartbeat(tracker, hb, clock);
        
        expect(result.status).toBe('ACK');
        expect(tracker.status).toBe('ALIVE');
        expect(tracker.lastSequence).toBe(1);
        expect(tracker.lastHeartbeatAt).toBe(101000);
    });

    test('2 & 3. IDENTITY BINDING: Rechaza sessionId o executionId ajenos', () => {
        const hbBadSession = { sessionId: 'HACKED_SESSION', executionId: 'EXEC_001', sequence: 1 };
        const hbBadExec = { sessionId: 'SESSION_PHYS_999', executionId: 'EXEC_002', sequence: 1 };

        expect(HeartbeatEngine.processHeartbeat(tracker, hbBadSession, clock).status).toBe('REJECTED');
        expect(HeartbeatEngine.processHeartbeat(tracker, hbBadExec, clock).status).toBe('REJECTED');
    });

    test('4. MONOTONIC SEQUENCE: Rechaza secuencias inferiores a la actual', () => {
        HeartbeatEngine.processHeartbeat(tracker, { sessionId: 'SESSION_PHYS_999', executionId: 'EXEC_001', sequence: 5 }, clock);
        
        const staleHb = { sessionId: 'SESSION_PHYS_999', executionId: 'EXEC_001', sequence: 4 };
        const result = HeartbeatEngine.processHeartbeat(tracker, staleHb, clock + 1000);
        
        expect(result.status).toBe('IGNORED');
        expect(result.reason).toBe('STALE_OR_DUPLICATE_SEQUENCE');
    });

    test('5. IDEMPOTENCE: Heartbeat exactamente duplicado se ignora con seguridad', () => {
        HeartbeatEngine.processHeartbeat(tracker, { sessionId: 'SESSION_PHYS_999', executionId: 'EXEC_001', sequence: 5 }, clock);
        const dupHb = { sessionId: 'SESSION_PHYS_999', executionId: 'EXEC_001', sequence: 5 };
        
        const result = HeartbeatEngine.processHeartbeat(tracker, dupHb, clock + 1000);
        expect(result.status).toBe('IGNORED');
    });

    test('6. LIVENESS THRESHOLD: Silencio que supera el umbral marca TIMED_OUT', () => {
        clock += 3001; // Supera los 3000ms de threshold
        const status = HeartbeatEngine.evaluateLiveness(tracker, clock);
        
        expect(status).toBe('TIMED_OUT');
        expect(tracker.status).toBe('TIMED_OUT');
    });

    test('7. TERMINALITY: Una sesión TIMED_OUT es irreversible y rechaza latidos póstumos', () => {
        HeartbeatEngine.evaluateLiveness(tracker, clock + 4000); // Muerte
        
        const lateHb = { sessionId: 'SESSION_PHYS_999', executionId: 'EXEC_001', sequence: 1 };
        const result = HeartbeatEngine.processHeartbeat(tracker, lateHb, clock + 4100);
        
        expect(result.status).toBe('REJECTED');
        expect(result.reason).toBe('SESSION_TERMINATED');
    });

    test('8. IDEMPOTENT RECOVERY: Evaluar timeout varias veces no clona los disparadores', () => {
        HeartbeatEngine.evaluateLiveness(tracker, clock + 4000);
        HeartbeatEngine.evaluateLiveness(tracker, clock + 5000);
        
        const recovery1 = HeartbeatEngine.deriveRecoveryContext(tracker);
        const recovery2 = HeartbeatEngine.deriveRecoveryContext(tracker);
        
        expect(recovery1.status).toBe('RECOVERY_TRIGGERED');
        expect(recovery2.status).toBe('ALREADY_RECOVERING'); // Idempotencia garantizada
    });

    test('9. BLOCK COMMIT: El estado TIMED_OUT prohíbe comprometer cambios editoriales', () => {
        HeartbeatEngine.evaluateLiveness(tracker, clock + 4000);
        expect(HeartbeatEngine.canCommit(tracker)).toBe(false);
    });

    test('10 & 11. RECOVERY HANDOFF: La derivación a E24.3 preserva jobIdentity y aísla la falla', () => {
        HeartbeatEngine.evaluateLiveness(tracker, clock + 4000);
        const recovery = HeartbeatEngine.deriveRecoveryContext(tracker);
        
        expect(recovery.jobIdentity).toBe('JOB_LEX_ALPHA');
        expect(recovery.failedExecutionId).toBe('EXEC_001');
        expect(recovery.failedSessionId).toBe('SESSION_PHYS_999');
        expect(recovery.action).toBe('ROLLBACK_AND_QUARANTINE');
    });

    test('12. TELEMETRY EXCLUSION: Identidad del tracker sobrevive aislada del reloj efímero', () => {
        const identity = HeartbeatEngine.getCanonicalTrackerIdentity(tracker);
        expect(identity).toHaveProperty('jobIdentity');
        expect(identity).toHaveProperty('executionId');
        expect(identity).not.toHaveProperty('lastHeartbeatAt'); // Exclusión de telemetría de runtime
    });
});