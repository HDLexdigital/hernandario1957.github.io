/**
 * E24.5.3 — HeartbeatEngine
 * 
 * - Monitorea la supervivencia de la sesión física (InDesign) de forma puramente funcional.
 * - Valida la monotonicidad estricta y correlación de identidad de los latidos.
 * - Deriva silencios prolongados a TIMED_OUT.
 * - Actúa como puente determinista hacia E24.3 para recuperación ante fallos.
 */

'use strict';

class HeartbeatEngine {
    /**
     * Inicializa un tracker de liveness para una sesión ya establecida.
     */
    static initializeTracker(session, options = {}) {
        if (!session.jobIdentity || !session.executionId || !session.sessionId) {
            throw new Error('HEARTBEAT_VIOLATION: Sesión inválida para inicializar tracker.');
        }

        return {
            jobIdentity: session.jobIdentity,
            executionId: session.executionId,
            sessionId: session.sessionId,
            status: 'ALIVE', 
            lastSequence: 0,
            lastHeartbeatAt: options.now || Date.now(),
            livenessThresholdMs: options.livenessThresholdMs || 3000,
            recoveryTriggered: false
        };
    }

    /**
     * Procesa un latido físico, validando identidad y monotonicidad.
     */
    static processHeartbeat(tracker, heartbeat, now = Date.now()) {
        if (tracker.status === 'TIMED_OUT' || tracker.status === 'CLOSED') {
            return { status: 'REJECTED', reason: 'SESSION_TERMINATED' };
        }
        if (heartbeat.sessionId !== tracker.sessionId) {
            return { status: 'REJECTED', reason: 'SESSION_ID_MISMATCH' };
        }
        if (heartbeat.executionId !== tracker.executionId) {
            return { status: 'REJECTED', reason: 'EXECUTION_ID_MISMATCH' };
        }
        
        // Invariante: Monotonicidad estricta e Idempotencia
        if (heartbeat.sequence <= tracker.lastSequence) {
            return { status: 'IGNORED', reason: 'STALE_OR_DUPLICATE_SEQUENCE' };
        }

        tracker.lastSequence = heartbeat.sequence;
        tracker.lastHeartbeatAt = now;

        return { status: 'ACK', sequence: heartbeat.sequence };
    }

    /**
     * Evalúa la condición de supervivencia basada en el tiempo transcurrido (silencio).
     */
    static evaluateLiveness(tracker, now = Date.now()) {
        if (tracker.status !== 'ALIVE') return tracker.status;

        const silence = now - tracker.lastHeartbeatAt;
        if (silence > tracker.livenessThresholdMs) {
            tracker.status = 'TIMED_OUT';
        }
        return tracker.status;
    }

    /**
     * Evalúa si el estado físico de la sesión autoriza un commit final.
     */
    static canCommit(tracker) {
        return tracker.status === 'ALIVE';
    }

    /**
     * Extrae el payload forense de recuperación para entregar a E24.3.
     */
    static deriveRecoveryContext(tracker) {
        if (tracker.status !== 'TIMED_OUT') {
            throw new Error('HEARTBEAT_VIOLATION: No se puede recuperar una sesión que no ha fallado.');
        }
        if (tracker.recoveryTriggered) {
            return { status: 'ALREADY_RECOVERING' };
        }
        
        tracker.recoveryTriggered = true;

        // Entregable estandarizado para E24.3
        return {
            status: 'RECOVERY_TRIGGERED',
            jobIdentity: tracker.jobIdentity,
            failedExecutionId: tracker.executionId,
            failedSessionId: tracker.sessionId,
            action: 'ROLLBACK_AND_QUARANTINE'
        };
    }

    /**
     * Devuelve la identidad estructural omitiendo metadatos volátiles.
     */
    static getCanonicalTrackerIdentity(tracker) {
        return {
            jobIdentity: tracker.jobIdentity,
            executionId: tracker.executionId,
            sessionId: tracker.sessionId,
            status: tracker.status
        };
    }
}

module.exports = HeartbeatEngine;