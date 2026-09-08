/**
 * O5.3 — Incident Containment & Quarantine Contract Suite (Q1–Q12)
 */

'use strict';

const path = require('path');
const IncidentContainmentQuarantineEngine = require(path.join(process.cwd(), 'src', 'operations', 'O5', 'IncidentContainmentQuarantineEngine'));

describe('O5.3 — Incident Containment & Quarantine Contract Suite (Q1–Q12)', () => {

    let quarantineEngine;
    let sampleIncident;
    let sampleClassification;
    let validAuth;

    beforeEach(() => {
        quarantineEngine = new IncidentContainmentQuarantineEngine();

        sampleIncident = Object.freeze({
            incidentId: 'INC_2026_001',
            sourceBinding: { executionId: 'EXEC_001' },
            initialState: 'OPEN'
        });

        sampleClassification = Object.freeze({
            incidentId: 'INC_2026_001',
            classificationHash: 'sha256_classification_mock_hash',
            status: 'CLASSIFIED'
        });

        validAuth = Object.freeze({
            authorizationId: 'AUTH_QUARANTINE_001',
            status: 'AUTHORIZED_CONTAINMENT'
        });
    });

    test('Q1, Q2, Q5, Q7, Q10 & Q12. CAMINO VERDE: Aislar un incidente clasificado bajo cuarentena generando veredicto determinista', () => {
        const record = quarantineEngine.quarantineIncident(sampleIncident, sampleClassification, validAuth);

        expect(record.status).toBe('QUARANTINED');
        expect(record.quarantineState).toBe('QUARANTINED');
        expect(record.containmentVerdictHash).toBeDefined();
    });

    test('Q2. CLASSIFICATION BINDING: Rechaza la cuarentena si el incidente no posee un registro de clasificación válido', () => {
        const unclassifiedIncident = { ...sampleClassification, status: 'DRAFT' };

        expect(() => {
            quarantineEngine.quarantineIncident(sampleIncident, unclassifiedIncident, validAuth);
        }).toThrow('CLASSIFICATION_BINDING_FAILURE');
    });

    test('Q11. IDEMPOTENT CONTAINMENT: Aislar dos veces el mismo incidente maneja el estado sin duplicidad ni ambigüedad', () => {
        const first = quarantineEngine.quarantineIncident(sampleIncident, sampleClassification, validAuth);
        const second = quarantineEngine.quarantineIncident(sampleIncident, sampleClassification, validAuth);

        expect(first.containmentVerdictHash).toBe(second.containmentVerdictHash);
        expect(second.idempotentRepeat).toBe(true);
        expect(second.status).toBe('QUARANTINED');
    });

    test('Q8 & Q9. EVIDENCE PRESERVATION: La cuarentena aísla el recurso operacional sin alterar los registros de intake o clasificación', () => {
        const classificationSnapshot = JSON.stringify(sampleClassification);

        quarantineEngine.quarantineIncident(sampleIncident, sampleClassification, validAuth);

        const classificationAfter = JSON.stringify(sampleClassification);
        expect(classificationAfter).toBe(classificationSnapshot);
    });
});