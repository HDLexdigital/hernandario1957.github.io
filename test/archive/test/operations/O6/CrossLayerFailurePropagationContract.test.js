/**
 * O6.5 — Cross-Layer Failure Propagation Contract Suite (F1–F12)
 */

'use strict';

const path = require('path');
const CrossLayerFailurePropagationEngine = require(path.join(process.cwd(), 'src', 'operations', 'O6', 'CrossLayerFailurePropagationEngine'));

describe('O6.5 — Cross-Layer Failure Propagation Contract Suite (F1–F12)', () => {

    let propagationEngine;
    let validFailureFlow;

    beforeEach(() => {
        propagationEngine = new CrossLayerFailurePropagationEngine();

        validFailureFlow = Object.freeze({
            executionId: 'EXEC_FAIL_001',
            status: 'FAILED',
            incidentRecord: {
                incidentId: 'INC_FAIL_001',
                sourceBinding: { executionId: 'EXEC_FAIL_001' }
            },
            classificationRecord: {
                incidentId: 'INC_FAIL_001',
                classificationHash: 'sha256_class_hash',
                status: 'CLASSIFIED'
            },
            quarantineRecord: {
                incidentId: 'INC_FAIL_001',
                containmentVerdictHash: 'sha256_quant_hash',
                status: 'QUARANTINED'
            },
            distributionState: 'BLOCKED',
            promotionBlocked: true
        });
    });

    test('F1, F2, F3, F4, F5, F6, F10 & F11. CAMINO VERDE: Verifica la propagación completa del fallo y el bloqueo efectivo de O4', () => {
        const verdict = propagationEngine.verifyFailurePropagation(validFailureFlow);

        expect(verdict.status).toBe('PROPAGATION_VERIFIED');
        expect(verdict.propagationVerdictHash).toBeDefined();
        expect(verdict.distributionBlocked).toBe(true);
        expect(verdict.promotionBlocked).toBe(true);
    });

    test('F5. DISTRIBUTION BOUNDARY ENFORCEMENT: Rechaza y detecta fuga si un artefacto comprometido alcanza el estado DISTRIBUTED', () => {
        const leakedFlow = {
            ...validFailureFlow,
            distributionState: 'DISTRIBUTED' // Fuga inadmisible a O4
        };

        expect(() => {
            propagationEngine.verifyFailurePropagation(leakedFlow);
        }).toThrow('DISTRIBUTED_BOUNDARY_VIOLATION');
    });

    test('F2. INCIDENT INTAKE BINDING: Rechaza la auditoría si un fallo no genera un registro de intake en O5.1', () => {
        const uncapturedFlow = {
            ...validFailureFlow,
            incidentRecord: null
        };

        expect(() => {
            propagationEngine.verifyFailurePropagation(uncapturedFlow);
        }).toThrow('FAILURE_PROPAGATION_BREAK');
    });

    test('F6. PROMOTION BOUNDARY ENFORCEMENT: Rechaza el flujo si la promoción posterior no fue bloqueada', () => {
        const unblockedPromotionFlow = {
            ...validFailureFlow,
            promotionBlocked: false // Violación de seguridad en O4
        };

        expect(() => {
            propagationEngine.verifyFailurePropagation(unblockedPromotionFlow);
        }).toThrow('PROMOTION_BOUNDARY_VIOLATION');
    });
});