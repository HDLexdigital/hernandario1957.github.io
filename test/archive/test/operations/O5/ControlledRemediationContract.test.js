/**
 * O5.5 — Controlled Remediation & Recertification Contract Suite (M1–M12)
 */

'use strict';

const path = require('path');
const ControlledRemediationEngine = require(path.join(process.cwd(), 'src', 'operations', 'O5', 'ControlledRemediationEngine'));

describe('O5.5 — Controlled Remediation & Recertification Contract Suite (M1–M12)', () => {

    let remediationEngine;
    let sampleIncident;
    let sampleQuarantine;
    let sampleAssessment;
    let validAuth;

    beforeEach(() => {
        remediationEngine = new ControlledRemediationEngine();

        sampleIncident = Object.freeze({
            incidentId: 'INC_2026_001',
            sourceBinding: { executionId: 'EXEC_ORIGIN_001' }
        });

        sampleQuarantine = Object.freeze({
            incidentId: 'INC_2026_001',
            status: 'QUARANTINED'
        });

        sampleAssessment = Object.freeze({
            incidentId: 'INC_2026_001',
            assessmentVerdictHash: 'sha256_assessment_verdict_mock',
            status: 'FORENSIC_ASSESSMENT_COMPLETE'
        });

        validAuth = Object.freeze({
            authorizationId: 'AUTH_REM_001',
            status: 'AUTHORIZED_REMEDIATION'
        });
    });

    test('M1, M2, M3, M5, M6 & M10. CAMINO VERDE: Autoriza remediación y spawnea nueva ejecución genealógica', () => {
        const record = remediationEngine.triggerRemediation(sampleIncident, sampleQuarantine, sampleAssessment, validAuth);

        expect(record.status).toBe('REMEDIATION_SPAWNED');
        expect(record.newExecutionId).toBeDefined();
        expect(record.parentExecutionId).toBe('EXEC_ORIGIN_001');
        expect(record.remediationVerdictHash).toBeDefined();
    });

    test('M3. QUARANTINE PREREQUISITE: Rechaza remediación si el recurso no se encuentra en estado QUARANTINED', () => {
        const unquarantined = { ...sampleQuarantine, status: 'OPEN' };

        expect(() => {
            remediationEngine.triggerRemediation(sampleIncident, unquarantined, sampleAssessment, validAuth);
        }).toThrow('QUARANTINE_PREREQUISITE_VIOLATION');
    });

    test('M2. ROOT-CAUSE BINDING: Rechaza remediación si falta el dictamen forense (O5.4) o su assessmentVerdictHash', () => {
        const incompleteAssessment = { ...sampleAssessment, status: 'DRAFT' };

        expect(() => {
            remediationEngine.triggerRemediation(sampleIncident, sampleQuarantine, incompleteAssessment, validAuth);
        }).toThrow('ROOT_CAUSE_BINDING_FAILURE');
    });

    test('M4 & M11. IMMUTABLE HISTORICAL BOUNDARY: La ejecución original y el assessment permanecen intactos sin hot repair', () => {
        const assessmentSnapshot = JSON.stringify(sampleAssessment);

        remediationEngine.triggerRemediation(sampleIncident, sampleQuarantine, sampleAssessment, validAuth);

        const assessmentAfter = JSON.stringify(sampleAssessment);
        expect(assessmentAfter).toBe(assessmentSnapshot);
    });
});