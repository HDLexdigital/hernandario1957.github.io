/**
 * E25.7 — Physical Commit Contract Suite
 * 
 * Fase: RED / IMPLEMENTATION
 * 
 * Contrato de Consolidación de Artefactos (Staging -> Master):
 * - C1. AUTHORIZED: Solo READY_TO_COMMIT promueve.
 * - C2. NO_PARTIAL: Fallo en 1 artefacto impide toda promoción.
 * - C3. STAGING: Escritura maestra solo tras validación en staging.
 * - C4. HASH INTEGRITY: Verificación SHA-256 previa al registro.
 * - C5. PROVENANCE: Enlace estricto a E24.4.
 * - C6. IDEMPOTENCY: Commit reintentado retorna ALREADY_COMMITTED.
 * - C7. HASH DIVERGENCE: Divergencia fuerza QUARANTINE.
 * - C8. TERMINAL: COMMITTED es estado irreversible.
 */

'use strict';

const PhysicalCommitEngine = require('../../../src/validadores/E25/PhysicalCommitEngine');

describe('E25.7 — Physical Commit Contract', () => {

    let mockSystem;

    beforeEach(() => {
        mockSystem = {
            master: {},
            staging: {
                'INDD_FILE': { hash: 'HASH_A', content: 'data' },
                'PDF_FILE': { hash: 'HASH_B', content: 'data' }
            },
            registry: {},
            quarantine: []
        };
    });

    test('C1 & C8. AUTHORIZED & TERMINAL: Solo READY_TO_COMMIT promueve; COMMITTED es terminal', () => {
        const context = { state: 'READY_TO_COMMIT', job: 'J1', exec: 'E1' };
        
        // Proveemos todos los artefactos del staging para cumplir con C2 (No Partial Commit)
        const res = PhysicalCommitEngine.commit(context, mockSystem, { 'INDD_FILE': 'HASH_A', 'PDF_FILE': 'HASH_B' });
        
        expect(res.status).toBe('COMMITTED');
        // Segundo commit sobre el mismo contexto es idempotente
        const res2 = PhysicalCommitEngine.commit(context, mockSystem, { 'INDD_FILE': 'HASH_A', 'PDF_FILE': 'HASH_B' });
        expect(res2.status).toBe('ALREADY_COMMITTED');
    });

    test('C2 & C3. NO_PARTIAL & STAGING: Fallo en 1 artefacto impide promoción al master', () => {
        const context = { state: 'READY_TO_COMMIT', job: 'J1', exec: 'E1' };
        // Faltan hashes para PDF_FILE
        const result = PhysicalCommitEngine.commit(context, mockSystem, { 'INDD_FILE': 'HASH_A' });
        
        expect(result.status).toBe('COMMIT_ABORTED');
        expect(mockSystem.master['INDD_FILE']).toBeUndefined(); // No se promocionó nada
    });

    test('C4 & C7. HASH INTEGRITY & DIVERGENCE: Divergencia fuerza cuarentena', () => {
        const context = { state: 'READY_TO_COMMIT', job: 'J1', exec: 'E1' };
        // Hash erróneo enviado
        const result = PhysicalCommitEngine.commit(context, mockSystem, { 'INDD_FILE': 'HASH_WRONG', 'PDF_FILE': 'HASH_B' });
        
        expect(result.status).toBe('COMMIT_REJECTED');
        expect(mockSystem.quarantine.length).toBe(1);
    });

    test('C5. PROVENANCE: Enlace a E24.4 en cada artefacto', () => {
        const context = { state: 'READY_TO_COMMIT', job: 'J1', exec: 'E1' };
        PhysicalCommitEngine.commit(context, mockSystem, { 'INDD_FILE': 'HASH_A', 'PDF_FILE': 'HASH_B' });
        
        expect(mockSystem.registry['INDD_FILE'].provenance).toBeDefined();
        expect(mockSystem.registry['INDD_FILE'].executionId).toBe('E1');
    });
});