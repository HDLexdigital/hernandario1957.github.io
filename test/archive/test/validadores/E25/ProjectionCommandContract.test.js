/**
 * E25.1 — Physical Projection Command Contract Suite
 * 
 * Fase: RED / IMPLEMENTATION
 * 
 * Contrato de Compilación y Transporte Físico:
 * - 1. PLAN INTEGRITY: Rechaza compilar un Projection Plan inválido o no certificado.
 * - 2. IDENTITY INJECTION: Todo comando físico hereda el jobIdentity y executionId.
 * - 3. SESSION MANDATORY: Todo comando físico inyecta el sessionId vigente (E24).
 * - 4. NODE PRESERVATION: El nodeId semántico (del AST) sobrevive en la primitiva física.
 * - 5. DETERMINISTIC ORDER: La secuencia de comandos respeta estrictamente el Projection Plan.
 * - 6. NO IMPLICIT SEMANTICS: El comando físico mapea propiedades directas sin "inventar" estilos o jerarquías.
 * - 7. EXPLICIT ERROR: Operaciones imposibles de mapear producen un fallo explícito antes del puente IPC.
 */

'use strict';

const CommandCompilerEngine = require('../../../src/validadores/E25/CommandCompilerEngine');

describe('E25.1 — Physical Projection Command Contract', () => {

    const mockSession = Object.freeze({
        jobIdentity: 'JOB_LEX_COLOMBIA',
        executionId: 'EXEC_001',
        sessionId: 'PHYS_SESSION_999'
    });

    const mockProjectionPlan = {
        planId: 'PLAN_001',
        status: 'CERTIFIED',
        operations: [
            { type: 'CREATE_DOCUMENT', params: { preset: 'LEGAL_A4' } },
            { type: 'APPLY_PARAGRAPH_STYLE', nodeId: 'NODE_TITULO_1', params: { styleName: 'Titulo_Articulo', text: 'ARTICULO 1' } },
            { type: 'INJECT_TEXT', nodeId: 'NODE_TEXTO_1', params: { text: 'Colombia es un Estado social de derecho.' } }
        ]
    };

    test('1. PLAN INTEGRITY: Rechaza compilar planes no certificados', () => {
        const uncertifiedPlan = { ...mockProjectionPlan, status: 'DRAFT' };
        
        expect(() => {
            CommandCompilerEngine.compilePlan(uncertifiedPlan, mockSession);
        }).toThrow('PROJECTION_VIOLATION: El plan de proyección no está certificado.');
    });

    test('2, 3 & 4. IDENTITY, SESSION & NODE PRESERVATION: Atributos blindados en la compilación', () => {
        const commands = CommandCompilerEngine.compilePlan(mockProjectionPlan, mockSession);
        
        // El primer comando hereda el contexto de orquestación
        expect(commands[0].jobIdentity).toBe(mockSession.jobIdentity);
        expect(commands[0].executionId).toBe(mockSession.executionId);
        expect(commands[0].sessionId).toBe(mockSession.sessionId);
        expect(commands[0].targetAction).toBe('executePhysicalPrimitive');

        // El segundo comando debe preservar su enlace al AST
        expect(commands[1].nodeId).toBe('NODE_TITULO_1');
        expect(commands[1].payload.styleName).toBe('Titulo_Articulo');
    });

    test('5. DETERMINISTIC ORDER: El orden de compilación es estrictamente secuencial', () => {
        const commands = CommandCompilerEngine.compilePlan(mockProjectionPlan, mockSession);
        
        expect(commands.length).toBe(3);
        expect(commands[0].payload.primitiveType).toBe('CREATE_DOCUMENT');
        expect(commands[1].payload.primitiveType).toBe('APPLY_PARAGRAPH_STYLE');
        expect(commands[2].payload.primitiveType).toBe('INJECT_TEXT');
    });

    test('6. NO IMPLICIT SEMANTICS: El compilador no inventa datos que no estén en el plan', () => {
        const commands = CommandCompilerEngine.compilePlan(mockProjectionPlan, mockSession);
        
        // No debe haber claves inyectadas arbitrariamente (e.g. un estilo por defecto no solicitado)
        expect(commands[2].payload.styleName).toBeUndefined();
        expect(commands[2].payload.text).toBe('Colombia es un Estado social de derecho.');
    });

    test('7. EXPLICIT ERROR: Operaciones desconocidas rompen la compilación tempranamente', () => {
        const badPlan = {
            planId: 'PLAN_ERR', status: 'CERTIFIED',
            operations: [{ type: 'MAGIC_MAKE_PRETTY', params: {} }]
        };

        expect(() => {
            CommandCompilerEngine.compilePlan(badPlan, mockSession);
        }).toThrow('COMPILER_ERROR: Operación lógica desconocida [MAGIC_MAKE_PRETTY]');
    });
});