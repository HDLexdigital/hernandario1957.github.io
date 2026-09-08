/**
 * E23.3.3 — UXP Projector Executor Contract Suite
 * 
 * Fase: RED
 * 
 * Contrato del Ejecutor del Proyector UXP (Modo DRY_RUN):
 * - Consume el plan de proyección (e23-projection-plan.json) en modo estricto de solo lectura.
 * - Valida la existencia y resolvibilidad de todos los metadatos obligatorios (paragraphStyle, exportTag).
 * - Garantiza que el número de nodos sea exacto, sin IDs duplicados ni 'unknown-id'.
 * - Emite un informe de auditoría de ejecución (Execution Audit) sin mutar el plan ni el entorno físico.
 * - Falla explícitamente ante cualquier anomalía estructural.
 */

'use strict';

// El ejecutor del proyector UXP aún no está implementado (Fase RED esperada)
const UxpProjectorExecutor = require('../../../src/validadores/E23/UxpProjectorExecutor');

describe('E23.3.3 — UXP Projector Executor Contract (Fase RED)', () => {

    const validProjectionPlan = Object.freeze({
        projectionVersion: 'E23.3.2',
        source: { stage: 'E21' },
        nodes: [
            {
                id: 'ARTICULO_1',
                domainType: 'ARTICULO',
                content: 'Contenido del artículo 1',
                projection: {
                    target: 'INDESIGN',
                    paragraphStyle: 'LD_Articulo_Principal',
                    exportTag: 'article'
                },
                children: [
                    {
                        id: 'PARRAFO_1',
                        domainType: 'PARRAFO',
                        content: 'Contenido del párrafo 1',
                        projection: {
                            target: 'INDESIGN',
                            paragraphStyle: 'LD_Cuerpo_Texto',
                            exportTag: 'p'
                        },
                        children: []
                    }
                ]
            }
        ]
    });

    test('1. DRY RUN EXECUTION: Audita y valida exitosamente un plan de proyección íntegro sin mutarlo', () => {
        const auditResult = UxpProjectorExecutor.execute(validProjectionPlan, { dryRun: true });

        expect(auditResult).toBeDefined();
        expect(auditResult.status).toBe('AUDIT_SUCCESS');
        expect(auditResult.mode).toBe('DRY_RUN');
        expect(auditResult.auditedNodesCount).toBe(2); // 1 raíz + 1 hijo
        expect(auditResult.mutationsPerformed).toBe(0);
    });

    test('2. UNKNOWN ID REJECTION: Falla de inmediato si algún nodo proyectado contiene "unknown-id"', () => {
        const corruptPlan = {
            projectionVersion: 'E23.3.2',
            source: { stage: 'E21' },
            nodes: [
                {
                    id: 'unknown-id', // ID prohibido
                    domainType: 'ARTICULO',
                    content: 'Texto',
                    projection: { target: 'INDESIGN', paragraphStyle: 'LD_Articulo', exportTag: 'article' },
                    children: []
                }
            ]
        };

        expect(() => {
            UxpProjectorExecutor.execute(corruptPlan, { dryRun: true });
        }).toThrow(/UXP_PROJECTOR_VIOLATION:.*unknown-id/);
    });

    test('3. MISSING STYLE REJECTION: Falla si un nodo carece de paragraphStyle o exportTag obligatorio', () => {
        const missingStylePlan = {
            projectionVersion: 'E23.3.2',
            source: { stage: 'E21' },
            nodes: [
                {
                    id: 'ARTICULO_2',
                    domainType: 'ARTICULO',
                    content: 'Texto',
                    projection: {
                        target: 'INDESIGN',
                        paragraphStyle: null, // Falta estilo obligatorio
                        exportTag: 'article'
                    },
                    children: []
                }
            ]
        };

        expect(() => {
            UxpProjectorExecutor.execute(missingStylePlan, { dryRun: true });
        }).toThrow(/UXP_PROJECTOR_VIOLATION:.*paragraphStyle/);
    });

    test('4. PLAN IMMUTABILITY: El plan de proyección de entrada permanece intacto tras la auditoría', () => {
        const planSnapshot = JSON.stringify(validProjectionPlan);

        UxpProjectorExecutor.execute(validProjectionPlan, { dryRun: true });

        expect(JSON.stringify(validProjectionPlan)).toBe(planSnapshot);
    });

});