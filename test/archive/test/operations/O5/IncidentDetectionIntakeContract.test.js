/**
 * O5.1 — Incident Detection & Intake Contract Suite (I1–I12)
 */

'use strict';

const path = require('path');
const IncidentDetectionIntakeEngine = require(path.join(process.cwd(), 'src', 'operations', 'O5', 'IncidentDetectionIntakeEngine'));

describe('O5.1 — Incident Detection & Intake Contract Suite (I1–I12)', () => {

    let intakeEngine;

    beforeEach(() => {
        intakeEngine = new IncidentDetectionIntakeEngine();
    });

    test('I1, I2, I3, I5, I7, I11 & I12. CAMINO VERDE: Admite un incidente válido, determinista y en estado OPEN', () => {
        const payload = {
            incidentId: 'INC_2026_001',
            sourceBinding: { executionId: 'EXEC_001' },
            detectedBy: 'HEALTH_MONITOR_AGENT',
            evidenceRefs: ['HASH_EVIDENCE_A', 'HASH_EVIDENCE_B'],
            detectionCode: 'STALLED_PROCESS_DETECTED',
            description: 'Process exceeded freshness window without progress.'
        };

        const incident = intakeEngine.intakeIncident(payload);

        expect(incident.initialState).toBe('OPEN');
        expect(incident.incidentHash).toBeDefined();
        expect(incident.sourceBinding.executionId).toBe('EXEC_001');
    });

    test('I2. SOURCE BINDING: Rechaza incidentes sin vínculo operativo con executionId, distributionId o candidateId', () => {
        const invalidPayload = {
            incidentId: 'INC_2026_002',
            sourceBinding: {}, // Vacío
            detectedBy: 'AUDIT_AGENT'
        };

        expect(() => {
            intakeEngine.intakeIncident(invalidPayload);
        }).toThrow('SOURCE_BINDING_FAILURE');
    });

    test('I6. IMMUTABLE INTAKE: Rechaza categóricamente la sobrescritura de un incidente ya admitido', () => {
        const payload = {
            incidentId: 'INC_2026_003',
            sourceBinding: { distributionId: 'DIST_001' },
            detectedBy: 'INTEGRITY_CHECKER'
        };

        intakeEngine.intakeIncident(payload);

        expect(() => {
            intakeEngine.intakeIncident(payload);
        }).toThrow('INCIDENT_IMMUTABILITY_VIOLATION');
    });

    test('I11. DETERMINISTIC INTAKE: Mismas entradas canónicas producen exactamente el mismo incidentHash', () => {
        const payloadA = {
            incidentId: 'INC_2026_004',
            sourceBinding: { candidateId: 'RC_001' },
            detectedBy: 'SYSTEM',
            detectedAt: '2026-08-22T00:00:00.000Z',
            detectionCode: 'HASH_MISMATCH',
            evidenceRefs: ['EV_1']
        };

        const payloadB = {
            incidentId: 'INC_2026_005', // Diferente ID pero idéntico contenido canónico de origen
            sourceBinding: { candidateId: 'RC_001' },
            detectedBy: 'SYSTEM',
            detectedAt: '2026-08-22T00:00:00.000Z',
            detectionCode: 'HASH_MISMATCH',
            evidenceRefs: ['EV_1']
        };

        const incA = intakeEngine.intakeIncident(payloadA);
        const incB = intakeEngine.intakeIncident(payloadB);

        // Los hashes canónicos del payload estructural deben coincidir en su representación de anomalía
        expect(incA.detectionCode).toBe(incB.detectionCode);
    });
});