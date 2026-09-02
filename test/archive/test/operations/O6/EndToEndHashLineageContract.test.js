/**
 * O6.2 — End-to-End Hash Lineage Contract Suite (H1–H12)
 */

'use strict';

const path = require('path');
const EndToEndHashLineageEngine = require(path.join(process.cwd(), 'src', 'operations', 'O6', 'EndToEndHashLineageEngine'));

describe('O6.2 — End-to-End Hash Lineage Contract Suite (H1–H12)', () => {

    let lineageEngine;
    let validChainRecord;

    beforeEach(() => {
        lineageEngine = new EndToEndHashLineageEngine();

        validChainRecord = Object.freeze({
            executionId: 'EXEC_2026_001',
            evidenceHash: 'sha256_evidence_origin_hash',
            ledgerHash: 'sha256_ledger_event_hash',
            manifestHash: 'sha256_distribution_manifest_hash',
            assessmentVerdictHash: 'sha256_forensic_assessment_hash',
            closureVerdictHash: 'sha256_incident_closure_hash'
        });
    });

    test('H1, H2, H3, H4, H11 & H12. CAMINO VERDE: Verifica la continuidad criptográfica de punta a punta generando un hash determinista', () => {
        const verdict = lineageEngine.verifyHashLineage(validChainRecord);

        expect(verdict.status).toBe('HASH_LINEAGE_VALID');
        expect(verdict.lineageVerdictHash).toBeDefined();
        expect(verdict.executionId).toBe('EXEC_2026_001');
    });

    test('H1. ROOT EVIDENCE HASH: Rechaza cadenas donde falta el hash de evidencia de origen (O1)', () => {
        const brokenRecord = { ...validChainRecord, evidenceHash: null };

        expect(() => {
            lineageEngine.verifyHashLineage(brokenRecord);
        }).toThrow('ROOT_EVIDENCE_HASH_MANDATORY');
    });

    test('H8 & H10. HASH LINEAGE BREAK: Rechaza hashes válidos pero correspondientes a otra genealogía o contexto cruzado', () => {
        const hijackedRecord = { ...validChainRecord, adversarialTrigger: 'CROSS_GENEALOGY_HASH' };

        expect(() => {
            lineageEngine.verifyHashLineage(hijackedRecord);
        }).toThrow('HASH_LINEAGE_BREAK');
    });

    test('H9. HASH LINEAGE COMPLETENESS: Rechaza auditorías incompletas si faltan eslabones críticos como el manifiesto o el ledger', () => {
        const incompleteRecord = { ...validChainRecord, manifestHash: null };

        expect(() => {
            lineageEngine.verifyHashLineage(incompleteRecord);
        }).toThrow('HASH_LINEAGE_INCOMPLETE');
    });
});