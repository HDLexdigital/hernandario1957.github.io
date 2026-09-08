/**
 * O6.1 — Cross-Layer Identity Integrity Contract Suite (I1–I12)
 */

'use strict';

const path = require('path');
const CrossLayerIdentityIntegrityEngine = require(path.join(process.cwd(), 'src', 'operations', 'O6', 'CrossLayerIdentityIntegrityEngine'));

describe('O6.1 — Cross-Layer Identity Integrity Contract Suite (I1–I12)', () => {

    let integrityEngine;

    beforeEach(() => {
        integrityEngine = new CrossLayerIdentityIntegrityEngine();
    });

    test('I1, I2, I3, I4, I7, I11 & I12. CAMINO VERDE: Verifica una línea genealógica coherente generando un hash determinista', () => {
        const lineage = {
            executionId: 'EXEC_2026_001',
            candidateId: 'RC_2026_001',
            releaseId: 'REL_2026_001',
            distributionId: 'DIST_2026_001'
        };

        const verdict = integrityEngine.verifyIdentityLineage(lineage);

        expect(verdict.status).toBe('IDENTITY_VALIDATED');
        expect(verdict.identityVerdictHash).toBeDefined();
        expect(verdict.executionId).toBe('EXEC_2026_001');
    });

    test('I1. VALID ROOT IDENTITY: Rechaza linajes sin executionId válido', () => {
        const invalidLineage = {
            candidateId: 'RC_2026_001'
        };

        expect(() => {
            integrityEngine.verifyIdentityLineage(invalidLineage);
        }).toThrow('INVALID_ROOT_IDENTITY');
    });

    test('I8. NO CROSS-BINDING: Rechaza combinaciones de identificadores pertenecientes a genealogías distintas', () => {
        const crossBoundLineage = {
            executionId: 'EXEC_001',
            candidateId: 'CAND_002', // Pertenece a otra genealogía simulada
            releaseId: 'REL_001'
        };

        expect(() => {
            integrityEngine.verifyIdentityLineage(crossBoundLineage);
        }).toThrow('CROSS_LAYER_IDENTITY_MISMATCH');
    });

    test('I6 & I7. REMEDIATION GENEALOGY: Rechaza un linaje donde la ejecución es progenitora de sí misma', () => {
        const selfParentLineage = {
            executionId: 'EXEC_001',
            parentExecutionId: 'EXEC_001' // Ruptura lógica
        };

        expect(() => {
            integrityEngine.verifyIdentityLineage(selfParentLineage);
        }).toThrow('CROSS_LAYER_IDENTITY_MISMATCH');
    });
});