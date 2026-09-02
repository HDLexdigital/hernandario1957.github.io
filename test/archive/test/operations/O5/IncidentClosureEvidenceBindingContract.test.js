/**
 * O5.6 — Incident Closure & Evidence Binding Contract Suite (C1–C12) [Hardened Matrix]
 */

'use strict';

const path = require('path');
const IncidentClosureEvidenceBindingEngine = require(path.join(process.cwd(), 'src', 'operations', 'O5', 'IncidentClosureEvidenceBindingEngine'));

describe('O5.6 — Incident Closure & Evidence Binding Contract Suite (C1–C12)', () => {

    let closureEngine;
    let sampleIncident;
    let sampleClassification;
    let sampleQuarantine;
    let sampleAssessment;
    let sampleRemediation;
    let validEvidenceContext;

    beforeEach(() => {
        closureEngine = new IncidentClosureEvidenceBindingEngine();

        sampleIncident = Object.freeze({
            incidentId: 'INC_2026_001',
            sourceBinding: { executionId: 'EXEC_001' }
        });

        sampleClassification = Object.freeze({
            incidentId: 'INC_2026_001',
            classificationHash: 'sha256_class_mock',
            status: 'CLASSIFIED'
        });

        sampleQuarantine = Object.freeze({
            incidentId: 'INC_2026_001',
            containmentVerdictHash: 'sha256_quant_mock',
            status: 'QUARANTINED'
        });

        sampleAssessment = Object.freeze({
            incidentId: 'INC_2026_001',
            assessmentVerdictHash: 'sha256_assessment_mock',
            status: 'FORENSIC_ASSESSMENT_COMPLETE'
        });

        sampleRemediation = Object.freeze({
            incidentId: 'INC_2026_001',
            newExecutionId: 'EXEC_REM_001',
            remediationVerdictHash: 'sha256_rem_mock',
            status: 'REMEDIATION_SPAWNED'
        });

        validEvidenceContext = Object.freeze({
            registryRef: 'REG_001',
            ledgerTailHash: 'sha256_ledger_tail',
            evidenceHash: 'sha256_evidence_content'
        });
    });

    test('C1, C2, C3, C4, C5, C6, C8 & C11. CAMINO VERDE: Cierra un incidente componiendo su rastro completo y generando hash determinista', () => {
        const cert = closureEngine.closeIncident(
            sampleIncident,
            sampleClassification,
            sampleQuarantine,
            sampleAssessment,
            sampleRemediation,
            validEvidenceContext
        );

        expect(cert.status).toBe('CLOSED_TERMINAL');
        expect(cert.closureState).toBe('CLOSED_REMEDIATED');
        expect(cert.closureVerdictHash).toBeDefined();
        expect(cert.evidenceBinding.registryRef).toBe('REG_001');
    });

    test('C6 & C11. EVIDENCE COMPLETENESS: Rechaza el cierre si falta contexto de Registry, Ledger o Evidence', () => {
        const incompleteContext = { registryRef: 'REG_001' }; // Faltan ledger y evidence

        expect(() => {
            closureEngine.closeIncident(
                sampleIncident,
                sampleClassification,
                sampleQuarantine,
                sampleAssessment,
                sampleRemediation,
                incompleteContext
            );
        }).toThrow('EVIDENCE_COMPLETENESS_FAILURE');
    });

    test('C10. CLOSURE INTEGRITY CONFLICT: Rechaza intentos de re-cerrar con evidencia divergente detectando colisión', () => {
        closureEngine.closeIncident(
            sampleIncident,
            sampleClassification,
            sampleQuarantine,
            sampleAssessment,
            sampleRemediation,
            validEvidenceContext
        );

        // Creamos un assessment alterado para forzar un hash de cierre divergente
        const conflictingAssessment = {
            ...sampleAssessment,
            assessmentVerdictHash: 'sha256_DIFFERENT_ASSESSMENT_HASH'
        };

        expect(() => {
            closureEngine.closeIncident(
                sampleIncident,
                sampleClassification,
                sampleQuarantine,
                conflictingAssessment,
                sampleRemediation,
                validEvidenceContext
            );
        }).toThrow('CLOSURE_INTEGRITY_CONFLICT');
    });

    test('C10. CLOSURE IDEMPOTENCY: Idénticas solicitudes repetidas devuelven el certificado terminal sin alteraciones', () => {
        const first = closureEngine.closeIncident(sampleIncident, sampleClassification, sampleQuarantine, sampleAssessment, sampleRemediation, validEvidenceContext);
        const second = closureEngine.closeIncident(sampleIncident, sampleClassification, sampleQuarantine, sampleAssessment, sampleRemediation, validEvidenceContext);

        expect(first.closureVerdictHash).toBe(second.closureVerdictHash);
        expect(second.idempotentRepeat).toBe(true);
        expect(second.status).toBe('CLOSED_TERMINAL');
    });
});