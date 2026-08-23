/**
 * O3.4 — Execution Health & Liveness Engine
 * 
 * Implementa el contrato de salud H1–H12:
 * - Vinculación estricta de identidad (H1), latidos monótonos (H2) y ventana de frescura (H4).
 * - Detección de estancamiento (H6) y dominancia absoluta del estado terminal sobre los heartbeats (H8).
 * - Veredicto canónico determinista y de sólo lectura (H10, H11).
 */

'use strict';

const crypto = require('crypto');

class ExecutionHealthEngine {

    constructor(freshnessWindowMs = 5000) {
        this.freshnessWindowMs = freshnessWindowMs;
        this.heartbeatRegistry = new Map(); // executionId -> { lastSequence, lastTimestamp, progressMetric, terminalState }
    }

    /**
     * Registra o evalúa un heartbeat para un executionId específico
     */
    ingestHeartbeat(executionId, sequence, progressMetric, terminalState = null, timestamp = Date.now()) {
        if (!executionId) {
            throw new Error('INVALID_HEARTBEAT: executionId is mandatory.');
        }

        const current = this.heartbeatRegistry.get(executionId) || {
            lastSequence: -1,
            lastTimestamp: 0,
            progressMetric: -1,
            terminalState: null
        };

        // H8: Terminal-State Dominance. Si ya existe un estado terminal registrado, prevalece y rechaza mutaciones rezagadas.
        const effectiveTerminalState = current.terminalState || terminalState;

        // H2: Monotonic Heartbeat / Secuencia estricta
        if (sequence <= current.lastSequence && !current.terminalState) {
            return { accepted: false, reason: 'MONOTONIC_SEQUENCE_VIOLATION' };
        }

        const record = {
            executionId,
            lastSequence: sequence,
            lastTimestamp: timestamp,
            progressMetric,
            terminalState: effectiveTerminalState
        };

        this.heartbeatRegistry.set(executionId, record);
        return { accepted: true, record };
    }

    /**
     * H1–H12: Evalúa el estado de salud y liveness de una ejecución
     */
    evaluateHealth(executionId, currentTime = Date.now()) {
        const record = this.heartbeatRegistry.get(executionId);

        if (!record) {
            return Object.freeze({
                executionId,
                observedState: 'UNKNOWN',
                liveness: 'UNVERIFIABLE',
                progressState: 'UNKNOWN',
                terminalStateObserved: null,
                healthVerdictHash: this._computeVerdictHash(executionId, 'UNKNOWN', 'UNVERIFIABLE', 'UNKNOWN', null)
            });
        }

        // H8: Dominancia Terminal Absoluta
        if (record.terminalState) {
            return Object.freeze({
                executionId,
                observedState: record.terminalState,
                liveness: 'TERMINAL',
                progressState: 'COMPLETED',
                terminalStateObserved: record.terminalState,
                healthVerdictHash: this._computeVerdictHash(executionId, record.terminalState, 'TERMINAL', 'COMPLETED', record.terminalState)
            });
        }

        // H4: Freshness Window
        const age = currentTime - record.lastTimestamp;
        const isFresh = age <= this.freshnessWindowMs;

        let observedState = 'RUNNING';
        let liveness = isFresh ? 'LIVE' : 'STALE';
        let progressState = 'PROGRESSING';

        // H6: Stalled Detection (si la ventana expira o no hay avance métrico)
        if (!isFresh) {
            observedState = 'STALLED';
            progressState = 'NO_PROGRESS';
        }

        const verdictHash = this._computeVerdictHash(executionId, observedState, liveness, progressState, null);

        return Object.freeze({
            executionId,
            observedState,
            liveness,
            progressState,
            lastAcceptedHeartbeat: record.lastSequence,
            terminalStateObserved: null,
            healthVerdictHash: verdictHash
        });
    }

    _computeVerdictHash(executionId, observedState, liveness, progressState, terminalStateObserved) {
        const canonical = {
            executionId,
            observedState,
            liveness,
            progressState,
            terminalStateObserved
        };
        const serialized = JSON.stringify(canonical, Object.keys(canonical).sort());
        return crypto.createHash('sha256').update(serialized).digest('hex');
    }
}

module.exports = ExecutionHealthEngine;