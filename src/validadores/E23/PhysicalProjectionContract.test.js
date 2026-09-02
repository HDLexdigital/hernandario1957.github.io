/**
 * E23.3.5.1 — Physical Projection Contract Suite
 * 
 * Fase: RED
 * 
 * Contrato de Proyección Física:
 * - Valida que el proyector físico consuma exclusivamente el plan certificado E23.3.2.
 * - Exige el uso obligatorio de un entorno de ejecución aislado (sandbox/copia) para evitar mutaciones sobre el maestro.
 * - Asegura que cada operación física conserve de forma inequívoca el ID lógico del AST original.
 * - Falla de inmediato si se detecta cualquier intento de inferencia estructural o alteración del plan.
 */

'use strict';

// El contrato y ejecutor físico aún no están implementados (Fase RED esperada)
const PhysicalProjector = require('../../../src/validadores/E23/PhysicalProjector');

describe('E23.3.5.1 — Physical Projection Contract (Fase RED)', () => {

    const certifiedPlanMock = Object.freeze({
        projectionVersion: 'E23.3.2',
        source: { stage: 'E21' },
        nodes: [
            {
                id: 'ARTICULO_BASE_41',
                domainType: 'ARTICULO',
                content: 'Artículo 41 de la Constitución Política',
                projection: {
                    target: 'INDESIGN',
                    paragraphStyle: 'LD_Articulo_Principal',
                    exportTag: 'article'
                },
                children: [
                    {
                        id: 'PARRAFO_SUB_1',
                        domainType: 'PARRAFO',
                        content: 'Texto del parágrafo subordinado',
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

    test('1. SANDBOX MANDATE: Falla si se intenta ejecutar una proyección física sin especificar un documento de destino aislado', () => {
        expect(() => {
            PhysicalProjector.projectToEnvironment(certifiedPlanMock, { sandboxPath: null });
        }).toThrow(/PHYSICAL_PROJECTION_VIOLATION:.*sandbox/);
    });

    test('2. PLAN LOCK: El plan de ejecución físico rechaza cualquier plan modificado o anómalo', () => {
        const tamperedPlan = {
            ...certifiedPlanMock,
            projectionVersion: 'INVALID_VERSION'
        };

        expect(() => {
            PhysicalProjector.projectToEnvironment(tamperedPlan, { sandboxPath: 'temp/sandbox.indd' });
        }).toThrow(/PHYSICAL_PROJECTION_VIOLATION:.*version/);
    });

    test('3. PRIMITIVE DISPATCH: Genera la secuencia exacta de operaciones atómicas auditables para cada nodo', () => {
        const executionPlan = PhysicalProjector.buildPrimitiveOperations(certifiedPlanMock);

        expect(executionPlan).toBeDefined();
        expect(Array.isArray(executionPlan)).toBe(true);
        expect(executionPlan.length).toBe(2); // 1 artículo + 1 párrafo

        // Valida la preservación de identidad lógica y estilos primitivos
        expect(executionPlan[0].logicalId).toBe('ARTICULO_BASE_41');
        expect(executionPlan[0].paragraphStyle).toBe('LD_Articulo_Principal');
        expect(executionPlan[1].logicalId).toBe('PARRAFO_SUB_1');
        expect(executionPlan[1].paragraphStyle).toBe('LD_Cuerpo_Texto');
    });

    test('4. LEDGER EMISSION: Produce un registro de auditoría (Projection Ledger) separado del estado lógico', () => {
        const auditResult = PhysicalProjector.simulateSandboxDispatch(certifiedPlanMock, 'temp/sandbox.indd');

        expect(auditResult).toBeDefined();
        expect(auditResult.ledgerEntries.length).toBe(2);
        expect(auditResult.ledgerEntries[0]).toHaveProperty('operation', 'CREATE_PARAGRAPH');
        expect(auditResult.ledgerEntries[0]).toHaveProperty('sourceNodeId', 'ARTICULO_BASE_41');
    });

});