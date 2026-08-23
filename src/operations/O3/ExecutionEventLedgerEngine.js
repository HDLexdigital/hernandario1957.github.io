/**
 * O3.2 — Execution Event Ledger Engine
 * 
 * - Gestiona el libro mayor hash-chain local, determinista e inmutable por ejecución.
 * - Garantiza los invariantes L1–L10 (Génesis, secuencia monotónica, hash canónico y detección de manipulación).
 */

'use strict';

const crypto = require('crypto');

class ExecutionEventLedgerEngine {

    constructor(executionId) {
        if (!executionId || typeof executionId !== 'string') {
            throw new Error('INVALID_LEDGER_INIT: executionId is mandatory for ledger creation.');
        }
        this.executionId = executionId.trim();
        this.chain = [];
    }

    /**
     * L4: Cálculo canónico y determinista del hash del evento (inmune a referencias vivas)
     */
    _calculateCanonicalHash(eventData) {
        const canonicalObject = {
            eventId: eventData.eventId,
            executionId: eventData.executionId,
            sequence: eventData.sequence,
            eventType: eventData.eventType,
            payload: eventData.payload ? JSON.parse(JSON.stringify(eventData.payload)) : {},
            previousEventHash: eventData.previousEventHash
        };

        const serialized = JSON.stringify(canonicalObject, Object.keys(canonicalObject).sort());
        return crypto.createHash('sha256').update(serialized).digest('hex');
    }

    /**
     * L1, L2, L3, L5, L6: Registra un nuevo evento anexándolo a la cadena hash
     */
    appendEvent(eventType, payload = {}) {
        const sequence = this.chain.length;
        const eventId = `EVT_${sequence}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        
        let previousEventHash = null;
        if (sequence > 0) {
            previousEventHash = this.chain[sequence - 1].eventHash;
        }

        const rawEvent = {
            eventId,
            executionId: this.executionId,
            sequence,
            eventType,
            payload: JSON.parse(JSON.stringify(payload)),
            previousEventHash
        };

        const eventHash = this._calculateCanonicalHash(rawEvent);

        const sealedEvent = {
            ...rawEvent,
            eventHash,
            appendedAt: new Date().toISOString()
        };

        this.chain.push(sealedEvent);
        return sealedEvent;
    }

    /**
     * L7 & L10: Audita y verifica la integridad matemática de toda la cadena hash
     */
    verifyLedgerIntegrity() {
        if (this.chain.length === 0) {
            return Object.freeze({ valid: true, totalEvents: 0, reason: 'EMPTY_LEDGER' });
        }

        for (let i = 0; i < this.chain.length; i++) {
            const current = this.chain[i];

            // L2: Verifica secuencia monotónica estricta
            if (current.sequence !== i) {
                return Object.freeze({ valid: false, failedIndex: i, reason: 'MONOTONIC_SEQUENCE_VIOLATION' });
            }

            // Recomputa el hash canónico del evento actual basado estrictamente en su contenido almacenado
            const recomputedHash = this._calculateCanonicalHash(current);
            if (recomputedHash !== current.eventHash) {
                return Object.freeze({ valid: false, failedIndex: i, reason: 'CHAIN_INTEGRITY_FAILURE_HASH_MISMATCH' });
            }

            // L5 & L3: Verifica génesis y enlace con el hash anterior real de la cadena
            if (i === 0) {
                if (current.previousEventHash !== null) {
                    return Object.freeze({ valid: false, failedIndex: i, reason: 'GENESIS_PREVIOUS_HASH_NOT_NULL' });
                }
            } else {
                const previousNode = this.chain[i - 1];
                const expectedPreviousHash = previousNode.eventHash;
                
                if (current.previousEventHash !== expectedPreviousHash) {
                    return Object.freeze({ valid: false, failedIndex: i, reason: 'CHAIN_INTEGRITY_FAILURE_PREVIOUS_HASH_MISMATCH' });
                }
            }
        }

        return Object.freeze({ valid: true, totalEvents: this.chain.length, reason: 'LEDGER_INTACT' });
    }

    /**
     * Devuelve una vista congelada de toda la cadena
     */
    getLedgerSnapshot() {
        return Object.freeze([...this.chain]);
    }
}

module.exports = ExecutionEventLedgerEngine;