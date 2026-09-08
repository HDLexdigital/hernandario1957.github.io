/**
 * O5.2 — Incident Classification Contract Suite (C1–C12)
 */

'use strict';

const path = require('path');
const IncidentClassificationEngine = require(path.join(process.cwd(), 'src', 'operations', 'O5', 'IncidentClassificationEngine'));

describe('O5.2 — Incident Classification Contract Suite (C1–C12)', () => {

    let classificationEngine;
    let sampleIncident;

    beforeEach(() => {
        classificationEngine = new IncidentClassificationEngine();

        sampleIncident = Object.freeze({
            incidentId: 'INC_2026_001',
            sourceBinding: { executionId: 'EXEC_001' },
            initialState: 'OPEN'
        });
    });

    test('C1, C3, C4, C9, C10 & C12. CAMINO VERDE: Clasifica un incidente bajo taxonomía controlada generando un hash determinista', () => {
        const result = classificationEngine.classifyIncident(
            sampleIncident,
            'RENDERING_ENVIRONMENT',
            'Font metrics divergence detected during InDesign PDF physical export.'
        );

        expect(result.status).toBe('CLASSIFIED');
        expect(result.taxonomyCategory).toBe('RENDERING_ENVIRONMENT');
        expect(result.classificationHash).toBeDefined();
    });

    test('C3. CONTROLLED TAXONOMY: Rechaza categorías causales que no pertenezcan al catálogo aprobado', () => {
        expect(() => {
            classificationEngine.classifyIncident(
                sampleIncident,
                'MAGIC_FIX_CATEGORY',
                'Attempting invalid taxonomy.'
            );
        }).toThrow('CONTROLLED_TAXONOMY_VIOLATION');
    });

    test('C8. EXPLICIT CLASSIFICATION: Exige un fundamento técnico (rationale) obligatorio para emitir dictamen', () => {
        expect(() => {
            classificationEngine.classifyIncident(
                sampleIncident,
                'INPUT_CONTENT',
                '   '
            );
        }).toThrow('RATIONALE_MANDATORY');
    });

    test('C9. DETERMINISTIC CLASSIFICATION: Misma entrada y fundamento producen exactamente el mismo classificationHash', () => {
        const resultA = classificationEngine.classifyIncident(
            { ...sampleIncident, incidentId: 'INC_A' },
            'OPERATIONAL_INFRASTRUCTURE',
            'Filesystem timeout during evidence readback.'
        );

        const resultB = classificationEngine.classifyIncident(
            { ...sampleIncident, incidentId: 'INC_B' },
            'OPERATIONAL_INFRASTRUCTURE',
            'Filesystem timeout during evidence readback.'
        );

        expect(resultA.classificationHash).toBe(resultB.classificationHash);
    });
});