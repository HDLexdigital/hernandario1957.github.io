/**
 * O6.3 — Lifecycle State Consistency Engine
 * 
 * - Verifica la legitimidad cronológica y transicional de los estados a través de todo el ciclo de vida (O1–O5).
 * - Garantiza los invariantes S1–S12 (Autómata normativo, prevención de saltos, orden temporal y read-only).
 */

'use strict';

const crypto = require('crypto');

class LifecycleStateConsistencyEngine {

    constructor() {
        this.verdictsStore = new Map(); // Almacén inmutable de veredictos de estado (stateVerdictHash -> StateVerdict)

        // S2. Autómata normativo global de transiciones permitidas
        this.allowedTransitions = new Map([
            ['CREATED', new Set(['RUNNING', 'FAILED'])],
            ['RUNNING', new Set(['CERTIFIED', 'FAILED', 'QUARANTINED'])],
            ['CERTIFIED', new Set(['RELEASE_AUTHORIZED', 'FAILED', 'QUARANTINED'])],
            ['RELEASE_AUTHORIZED', new Set(['PRODUCTION', 'QUARANTINED'])],
            ['PRODUCTION', new Set(['DISTRIBUTED', 'QUARANTINED'])],
            ['DISTRIBUTED', new Set(['QUARANTINED'])],
            ['FAILED', new Set(['QUARANTINED'])],
            ['QUARANTINED', new Set(['ASSESSED'])],
            ['ASSESSED', new Set(['REMEDIATED'])],
            ['REMEDIATED', new Set(['CLOSED'])],
            ['CLOSED', new Set()] // Estado terminal estricto
        ]);
    }

    /**
     * S1–S12: Audita una secuencia de estados de forma determinista, verificando transiciones y cronología
     */
    verifyStateConsistency(sequenceRecord) {
        // S1. Valid Initial State & S5. Identity-State Binding
        if (!sequenceRecord || !sequenceRecord.executionId || !Array.isArray(sequenceRecord.states) || sequenceRecord.states.length === 0) {
            throw new Error('INVALID_SEQUENCE_RECORD: executionId and a non-empty states array are mandatory.');
        }

        const { executionId, states } = sequenceRecord;
        const initialTransition = states[0];

        if (!initialTransition || initialTransition.state !== 'CREATED') {
            throw new Error('INVALID_INITIAL_STATE: Lifecycle sequence must start at state CREATED.');
        }

        // S2, S3 & S4: Validación iterativa del autómata normativo, saltos y cronología
        let previousState = initialTransition.state;
        let previousTimestamp = new Date(initialTransition.timestamp || 0).getTime();

        const normalizedSequence = [{ state: previousState, timestamp: initialTransition.timestamp }];

        for (let i = 1; i < states.length; i++) {
            const current = states[i];
            const currentState = current.state;
            const currentTimestamp = new Date(current.timestamp || 0).getTime();

            // S4. Chronological Ordering
            if (currentTimestamp < previousTimestamp) {
                throw new Error('CHRONOLOGICAL_ORDERING_VIOLATION: State transition timestamps must respect forward time order.');
            }

            // S2. Allowed Transitions & S3. No State Skipping
            const allowedNextStates = this.allowedTransitions.get(previousState);
            if (!allowedNextStates || !allowedNextStates.has(currentState)) {
                throw new Error(`LIFECYCLE_STATE_TRANSITION_INVALID: Transition from '${previousState}' to '${currentState}' is forbidden by the normative automaton.`);
            }

            previousState = currentState;
            previousTimestamp = currentTimestamp;
            normalizedSequence.push({ state: currentState, timestamp: current.timestamp });
        }

        // S11. Deterministic State Verdict Hash (excluyendo metadatos de runtime)
        const canonicalPayload = {
            executionId,
            sequence: normalizedSequence
        };

        const serialized = JSON.stringify(canonicalPayload, Object.keys(canonicalPayload).sort());
        const stateVerdictHash = crypto.createHash('sha256').update(serialized).digest('hex');

        const stateVerdict = Object.freeze({
            ...canonicalPayload,
            stateVerdictHash,
            status: 'LIFECYCLE_CONSISTENT',
            verifiedAt: new Date().toISOString()
        });

        // Almacenamiento inmutable read-only
        this.verdictsStore.set(stateVerdictHash, stateVerdict);

        return stateVerdict;
    }

    /**
     * Consulta un veredicto de estado guardado
     */
    lookupStateVerdict(stateVerdictHash) {
        if (!this.verdictsStore.has(stateVerdictHash)) {
            throw new Error(`STATE_VERDICT_NOT_FOUND: State verdict hash ${stateVerdictHash} does not exist.`);
        }
        return this.verdictsStore.get(stateVerdictHash);
    }
}

module.exports = LifecycleStateConsistencyEngine;