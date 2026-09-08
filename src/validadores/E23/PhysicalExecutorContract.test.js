/**
 * E23.3.5.2 — UXP Physical Executor Contract Suite
 * 
 * Fase: RED
 * 
 * Contrato del Ejecutor Físico UXP:
 * - Compila un plan de proyección certificado en una secuencia determinista de operaciones primitivas atómicas.
 * - Separa el Ledger Lógico (determinista y hashable) de los Metadatos de Ejecución (tiempo de ejecución, timestamps).
 * - Garantiza la política de transaccionalidad estricta NO_PARTIAL_COMMIT (falla y aborta ante cualquier anomalía).
 * - Asegura la inmutabilidad absoluta del plan original y el cero uso de inferencia semántica.
 */

'use strict';

// El ejecutor físico aún no está implementado (Fase RED esperada)
const PhysicalExecutor = require('../../../src/validadores/E23/PhysicalExecutor');

describe('E23.3.5.2 — UXP Physical Executor Contract (Fase RED)', () => {

    const validPlanMock = Object.freeze({
        projectionVersion: 'E23.3.2',
        source: { stage: 'E21' },
        nodes: [
            {
                id: 'ARTICULO_BASE_41',
                domainType: 'ARTICULO',
                content: 'Texto del artículo 41',
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

    test('1. PRIMITIVE COMPILATION: Traduce el plan en una secuencia de primitivas atómicas ordenadas sin inferir semántica', () => {
        const executionSet = PhysicalExecutor.compilePrimitives(validPlanMock);

        expect(executionSet).toBeDefined();
        expect(Array.isArray(executionSet.primitives)).toBe(true);
        expect(executionSet.primitives.length).toBe(2);

        // Verifica operaciones primitivas
        expect(executionSet.primitives[0].operation).toBe('CREATE_PARAGRAPH');
        expect(executionSet.primitives[0].logicalId).toBe('ARTICULO_BASE_41');
        expect(executionSet.primitives[0].paragraphStyle).toBe('LD_Articulo_Principal');
        
        expect(executionSet.primitives[1].operation).toBe('PLACE_CHILD');
        expect(executionSet.primitives[1].logicalId).toBe('PARRAFO_SUB_1');
        expect(executionSet.primitives[1].parentId).toBe('ARTICULO_BASE_41');
    });

    test('2. LEDGER ISOLATION: Separa estrictamente el ledger lógico determinista de los metadatos temporales de ejecución', () => {
        const dispatchResult = PhysicalExecutor.executeSandbox(validPlanMock, { sandboxPath: 'temp/sandbox.indd' });

        expect(dispatchResult).toBeDefined();
        expect(dispatchResult.logicalLedger).toBeDefined();
        expect(dispatchResult.runtimeMetadata).toBeDefined();

        // El ledger lógico debe ser puramente determinista (sin timestamps)
        dispatchResult.logicalLedger.entries.forEach(entry => {
            expect(entry).not.toHaveProperty('timestamp');
            expect(entry).toHaveProperty('nodeId');
            expect(entry).toHaveProperty('operation');
        });

        // Los metadatos de ejecución contienen la información temporal/de sesión
        expect(dispatchResult.runtimeMetadata).toHaveProperty('timestamp');
        expect(dispatchResult.runtimeMetadata).toHaveProperty('sessionId');
    });

    test('3. NO PARTIAL COMMIT: Aborta y rechaza la ejecución si cualquier nodo presenta irregularidades (transaccionalidad total)', () => {
        const corruptPlan = {
            projectionVersion: 'E23.3.2',
            source: { stage: 'E21' },
            nodes: [
                {
                    id: 'ARTICULO_OK',
                    domainType: 'ARTICULO',
                    content: 'Texto',
                    projection: { target: 'INDESIGN', paragraphStyle: 'LD_Articulo', exportTag: 'article' },
                    children: []
                },
                {
                    id: 'ARTICULO_CORRUPTO',
                    domainType: 'ARTICULO',
                    content: 'Texto',
                    projection: { target: 'INDESIGN', paragraphStyle: null, exportTag: 'article' }, // Estilo inválido
                    children: []
                }
            ]
        };

        expect(() => {
            PhysicalExecutor.executeSandbox(corruptPlan, { sandboxPath: 'temp/sandbox.indd' });
        }).toThrow(/PHYSICAL_EXECUTION_VIOLATION:.*NO_PARTIAL_COMMIT/);
    });

    test('4. DETERMINISTIC DISPATCH: Mismo plan de entrada produce idéntica secuencia lógica de ejecución', () => {
        const firstRun = PhysicalExecutor.compilePrimitives(validPlanMock);
        const secondRun = PhysicalExecutor.compilePrimitives(validPlanMock);

        expect(JSON.stringify(firstRun)).toBe(JSON.stringify(secondRun));
    });

});