/**
 * O6.6 — Systemic Certification & Governance Contract Suite (SC1–SC12)
 */

'use strict';

const path = require('path');
const SystemicCertificationGovernanceEngine = require(path.join(process.cwd(), 'src', 'operations', 'O6', 'SystemicCertificationGovernanceEngine'));

describe('O6.6 — Systemic Certification & Governance Contract Suite (SC1–SC12)', () => {

    let governanceEngine;
    let mockIdentity;
    let mockLineage;
    let mockState;
    let mockGraph;
    let mockPropagation;

    beforeEach(() => {
        governanceEngine = new SystemicCertificationGovernanceEngine();

        mockIdentity = Object.freeze({
            executionId: 'EXEC_SYS_001',
            identityVerdictHash: 'hash_id_001',
            status: 'IDENTITY_VALIDATED'
        });

        mockLineage = Object.freeze({
            executionId: 'EXEC_SYS_001',
            lineageVerdictHash: 'hash_lineage_001',
            status: 'HASH_LINEAGE_VALID'
        });

        mockState = Object.freeze({
            executionId: 'EXEC_SYS_001',
            stateVerdictHash: 'hash_state_001',
            status: 'LIFECYCLE_CONSISTENT'
        });

        mockGraph = Object.freeze({
            graphVerdictHash: 'hash_graph_001',
            status: 'EVIDENCE_GRAPH_CONSISTENT'
        });

        mockPropagation = Object.freeze({
            executionId: 'EXEC_SYS_001',
            propagationVerdictHash: 'hash_prop_001',
            status: 'PROPAGATION_VERIFIED'
        });
    });

    test('SC1, SC2, SC3, SC4, SC5, SC6, SC7, SC8, SC10 & SC11. CAMINO VERDE: Compone los 5 dictámenes de O6 y emite el Veredicto Sistémico Global', () => {
        const cert = governanceEngine.certifySystemicState(
            'EXEC_SYS_001',
            mockIdentity,
            mockLineage,
            mockState,
            mockGraph,
            mockPropagation
        );

        expect(cert.status).toBe('SYSTEMIC_CERTIFIED');
        expect(cert.systemicVerdictHash).toBeDefined();
        expect(cert.executionId).toBe('EXEC_SYS_001');
    });

    test('SC9. CROSS-VERIFIER COMPATIBILITY: Rechaza la certificación si uno de los componentes presenta una identidad genealógica divergente', () => {
        const conflictingPropagation = {
            ...mockPropagation,
            executionId: 'EXEC_SYS_999' // Conflicto de identidad cruzada
        };

        expect(() => {
            governanceEngine.certifySystemicState(
                'EXEC_SYS_001',
                mockIdentity,
                mockLineage,
                mockState,
                mockGraph,
                conflictingPropagation
            );
        }).toThrow('SYSTEMIC_INTEGRITY_CONFLICT');
    });

    test('SC2. COMPLETE O6 VERDICT SET: Rechaza la emisión si falta cualquiera de los veredictos transversales obligatorios', () => {
        expect(() => {
            governanceEngine.certifySystemicState(
                'EXEC_SYS_001',
                mockIdentity,
                mockLineage,
                mockState,
                mockGraph,
                null // Falta O6.5
            );
        }).toThrow('COMPLETE_O6_VERDICT_SET_REQUIRED');
    });

    test('SC11. SYSTEMIC VERDICT IDEMPOTENCY: Solicitudes idénticas repetidas devuelven el certificado sistémico sin alteraciones', () => {
        const first = governanceEngine.certifySystemicState('EXEC_SYS_001', mockIdentity, mockLineage, mockState, mockGraph, mockPropagation);
        const second = governanceEngine.certifySystemicState('EXEC_SYS_001', mockIdentity, mockLineage, mockState, mockGraph, mockPropagation);

        expect(first.systemicVerdictHash).toBe(second.systemicVerdictHash);
        expect(second.idempotentRepeat).toBe(true);
        expect(second.status).toBe('SYSTEMIC_CERTIFIED');
    });
});