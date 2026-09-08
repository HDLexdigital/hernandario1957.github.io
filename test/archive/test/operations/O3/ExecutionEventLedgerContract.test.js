/**
 * O3.2 — Execution Event Ledger Contract Suite (L1–L10)
 */

'use strict';

const path = require('path');
const ExecutionEventLedgerEngine = require(path.join(process.cwd(), 'src', 'operations', 'O3', 'ExecutionEventLedgerEngine'));

describe('O3.2 — Execution Event Ledger Contract Suite', () => {

    test('L1, L2, L3, L5 & L6. GÉGENESIS Y SECUENCIA MONOTÓNICA: Crea el evento de génesis y enlaza la cadena correctamente', () => {
        const ledger = new ExecutionEventLedgerEngine('EXEC_LEDGER_001');

        const e0 = ledger.appendEvent('CREATED', { corpusId: 'TEST' });
        const e1 = ledger.appendEvent('VALIDATED', { status: 'OK' });

        expect(e0.sequence).toBe(0);
        expect(e0.previousEventHash).toBeNull();
        expect(e0.eventHash).toBeDefined();

        expect(e1.sequence).toBe(1);
        expect(e1.previousEventHash).toBe(e0.eventHash);
        expect(e1.eventHash).toBeDefined();
    });

    test('L7 & L10. INTEGRIDAD Y AUDITORÍA READ-ONLY: Verifica una cadena intacta con éxito', () => {
        const ledger = new ExecutionEventLedgerEngine('EXEC_LEDGER_002');
        ledger.appendEvent('CREATED');
        ledger.appendEvent('RUNNING');
        ledger.appendEvent('CERTIFIED');

        const audit = ledger.verifyLedgerIntegrity();
        expect(audit.valid).toBe(true);
        expect(audit.totalEvents).toBe(3);
        expect(audit.reason).toBe('LEDGER_INTACT');
    });

    test('L7. CADENA ADVERSARIAL (DETECCIÓN DE ALTERACIÓN): Detecta modificación en el payload de un evento', () => {
        const ledger = new ExecutionEventLedgerEngine('EXEC_LEDGER_003');
        ledger.appendEvent('CREATED', { step: 1 });
        ledger.appendEvent('RUNNING', { step: 2 });

        // Simula ataque externo: cambia el payload y artificialmente fija un eventHash falso o inválido
        ledger.chain[0] = {
            ...ledger.chain[0],
            payload: { step: 99999 },
            eventHash: 'FAKE_HASH_FORGED_BY_ATTACKER'
        };

        const audit = ledger.verifyLedgerIntegrity();
        expect(audit.valid).toBe(false);
        expect(audit.reason).toBe('CHAIN_INTEGRITY_FAILURE_HASH_MISMATCH');
    });

    test('L7. CADENA ADVERSARIAL (ROPTURA DE ENLACE): Detecta manipulación en el previousEventHash', () => {
        const ledger = new ExecutionEventLedgerEngine('EXEC_LEDGER_004');
        ledger.appendEvent('CREATED');
        ledger.appendEvent('RUNNING');

        // Rompe artificialmente el enlace hash anterior
        ledger.chain[1] = {
            ...ledger.chain[1],
            previousEventHash: 'CORRUPTED_HASH_STRING_XYZ'
        };

        const audit = ledger.verifyLedgerIntegrity();
        expect(audit.valid).toBe(false);
        // La alteración del previousEventHash muta el contenido canónico evaluado, disparando la divergencia de hash
        expect(audit.reason).toBe('CHAIN_INTEGRITY_FAILURE_HASH_MISMATCH');
    });

    test('L1. RIGOR DE INICIALIZACIÓN: Rechaza la creación de un ledger sin executionId', () => {
        expect(() => {
            new ExecutionEventLedgerEngine(null);
        }).toThrow('INVALID_LEDGER_INIT');
    });
});