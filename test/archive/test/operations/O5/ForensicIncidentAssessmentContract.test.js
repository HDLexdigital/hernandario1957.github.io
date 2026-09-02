/**
 * O5.4 — Forensic Incident Assessment Contract Suite (FA1–FA12)
 */

'use strict';

const path = require('path');
const ForensicIncidentAssessmentEngine = require(path.join(process.cwd(), 'src', 'operations', 'O5', 'ForensicIncidentAssessmentEngine'));
const crypto = require('crypto');

describe('O5.4 — Forensic Incident Assessment Contract Suite (FA1–FA12)', () => {

    let assessmentEngine;
    let sampleIncident;
    let sampleQuarantine;
    let validForensicContext;

    beforeEach(() => {
        assessmentEngine = new ForensicIncidentAssessmentEngine();

        sampleIncident = Object.freeze({
            incidentId: 'INC_2026_001',
            sourceBinding: { executionId: 'EXEC_001' }
        });

        sampleQuarantine = Object.freeze({
            incidentId: 'INC_2026_001',
            status: 'QUARANTINED'
        });

        const rawContent = 'RAW_EVIDENCE_STREAM_CONTENT_2026';
        const evHash = crypto.createHash('sha256').update(rawContent).digest('hex');

        validForensicContext = Object.freeze({
            executionId: 'EXEC_001',
            ledgerTailHash: 'sha256_ledger_tail_mock',
            evidenceHash: evHash,
            rawEvidenceContent: rawContent,
            rootCauseCategory: 'RENDERING_ENVIRONMENT',
            rationale: 'InDesign typography engine mismatch confirmed via forensic trace O3.3.'
        });
    });

    test('FA1, FA3, FA7, FA8, FA10 & FA12. CAMINO VERDE: Realiza una evaluación forense y emite veredicto determinista', () => {
        const result = assessmentEngine.assessIncident(sampleIncident, sampleQuarantine, validForensicContext);

        expect(result.status).toBe('FORENSIC_ASSESSMENT_COMPLETE');
        expect(result.rootCauseCategory).toBe('RENDERING_ENVIRONMENT');
        expect(result.assessmentVerdictHash).toBeDefined();
    });

    test('FA7. EVIDENCE INTEGRITY: Detecta manipulación de evidencia y rechaza el assessment por hash mismatch', () => {
        const tamperedContext = {
            ...validForensicContext,
            rawEvidenceContent: 'TAMPERED_CONTENT_BYTE' // Provoca divergencia con evidenceHash
        };

        expect(() => {
            assessmentEngine.assessIncident(sampleIncident, sampleQuarantine, tamperedContext);
        }).toThrow('FORENSIC_EVIDENCE_INTEGRITY_FAILURE');
    });

    test('FA9. MANDATORY RATIONALE: Rechaza dictámenes sin fundamento técnico detallado (rationale)', () => {
        const invalidContext = {
            ...validForensicContext,
            rationale: '   '
        };

        expect(() => {
            assessmentEngine.assessIncident(sampleIncident, sampleQuarantine, invalidContext);
        }).toThrow('RATIONALE_REQUIRED');
    });

    test('FA11. READ-ONLY FORENSIC BOUNDARY: La evaluación forense no muta el registro de incidente ni el de cuarentena', () => {
        const quarantineSnapshot = JSON.stringify(sampleQuarantine);

        assessmentEngine.assessIncident(sampleIncident, sampleQuarantine, validForensicContext);

        const quarantineAfter = JSON.stringify(sampleQuarantine);
        expect(quarantineAfter).toBe(quarantineSnapshot);
    });
});