/**
 * E24.5.4 — Graceful Shutdown Contract Suite
 * 
 * Fase: RED / IMPLEMENTATION
 * 
 * Contrato Terminal de Sesión Física (InDesign):
 * - 1. Closes active session (G1)
 * - 2. Irrevocably revokes session authority (G2)
 * - 3. Rejects commands after shutdown (G3)
 * - 4. Shutdown is idempotent (G4)
 * - 5. Repeated shutdown produces no duplicate commit (G5)
 * - 6. Normal shutdown requires authorized commit (G6)
 * - 7. Abortive shutdown forbids pending commit (G7, G8)
 * - 8. Timeout/failure forces abortive shutdown (G8)
 * - 9. Workspace/lock cleanup is deterministic (G9, G10)
 * - 10. Lifecycle invariants preserved (G11-G15)
 */

'use strict';

const GracefulShutdownEngine = require('../../../src/validadores/E24/GracefulShutdownEngine');

describe('E24.5.4 — Graceful Shutdown Contract', () => {

    const mockActiveSession = Object.freeze({
        status: 'ESTABLISHED',
        state: 'ACTIVE',
        jobIdentity: 'JOB_LEX_OMEGA',
        executionId: 'EXEC_099',
        sessionId: 'PHYS_SESSION_123',
        workspaceId: 'WS_TEMP_001'
    });

    test('1 & 2. G1/G2: Closes active session and irrevocably revokes authority', () => {
        const closed = GracefulShutdownEngine.executeShutdown(mockActiveSession, { outcome: 'SUCCESS' });
        
        expect(closed.status).toBe('CLOSED');
        expect(closed.state).toBe('REVOKED');
        expect(closed.shutdownOutcome).toBe('NORMAL_SHUTDOWN');
    });

    test('3. G3: Rejects any commands after shutdown is executed', () => {
        const closed = GracefulShutdownEngine.executeShutdown(mockActiveSession, { outcome: 'SUCCESS' });
        
        const auth = GracefulShutdownEngine.validateCommandAuth(closed, { command: 'ANY' });
        
        expect(auth.authorized).toBe(false);
        expect(auth.reason).toBe('SESSION_REVOKED_AND_CLOSED');
    });

    test('4 & 5. G4/G5: Shutdown is perfectly idempotent and prevents duplicate commits', () => {
        const closed1 = GracefulShutdownEngine.executeShutdown(mockActiveSession, { outcome: 'SUCCESS' });
        const closed2 = GracefulShutdownEngine.executeShutdown(closed1, { outcome: 'SUCCESS' });
        const closed3 = GracefulShutdownEngine.executeShutdown(closed2, { outcome: 'SUCCESS' });
        
        // Exactamente el mismo objeto inmutable resultante sin efectos secundarios repetidos
        expect(closed3).toEqual(closed1);
        expect(closed3.commitsExecutedDuringShutdown).toBe(0); // El commit ya debió ocurrir antes, no aquí
    });

    test('6. G6: NORMAL_SHUTDOWN exige que la ejecución haya sido SUCCESS', () => {
        const closed = GracefulShutdownEngine.executeShutdown(mockActiveSession, { outcome: 'SUCCESS' });
        expect(closed.shutdownOutcome).toBe('NORMAL_SHUTDOWN');
        expect(closed.workspaceCleaned).toBe(true);
    });

    test('7 & 8. G7/G8: TIMEOUT o FAILURE fuerzan ABORTIVE_SHUTDOWN y prohíben commits', () => {
        const closedTimeout = GracefulShutdownEngine.executeShutdown(mockActiveSession, { outcome: 'TIMEOUT' });
        const closedFailure = GracefulShutdownEngine.executeShutdown(mockActiveSession, { outcome: 'FAILURE' });
        const closedQuarantine = GracefulShutdownEngine.executeShutdown(mockActiveSession, { outcome: 'QUARANTINE' });
        
        expect(closedTimeout.shutdownOutcome).toBe('ABORTIVE_SHUTDOWN');
        expect(closedFailure.shutdownOutcome).toBe('ABORTIVE_SHUTDOWN');
        expect(closedQuarantine.shutdownOutcome).toBe('ABORTIVE_SHUTDOWN');
        
        expect(closedTimeout.commitProhibited).toBe(true);
    });

    test('9. G9/G10: Workspace and lock cleanup is explicitly verified and deterministic', () => {
        const closed = GracefulShutdownEngine.executeShutdown(mockActiveSession, { outcome: 'SUCCESS' });
        
        expect(closed.locksCleared).toBe(true);
        expect(closed.workspaceCleaned).toBe(true);
        expect(closed.danglingStates).toBe(0);
    });

    test('10. G11-G15: Lifecycle invariants (jobIdentity, executionId, sessionId) remain immutable', () => {
        const closed = GracefulShutdownEngine.executeShutdown(mockActiveSession, { outcome: 'FAILURE' });
        
        expect(closed.jobIdentity).toBe('JOB_LEX_OMEGA');
        expect(closed.executionId).toBe('EXEC_099');
        expect(closed.sessionId).toBe('PHYS_SESSION_123');
        expect(closed.shutdownTimestamp).toBeDefined();
    });
});