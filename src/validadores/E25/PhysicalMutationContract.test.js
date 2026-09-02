/**
 * E25.3 — Physical Mutation Contract Suite
 * 
 * Fase: RED / IMPLEMENTATION
 * 
 * Contrato de Comportamiento Físico (Simulación del Host InDesign):
 * - M1. CORRELATION INTEGRITY: Respuesta preserva commandId, executionId, sessionId.
 * - M2. STRICT RESOURCE REJECTION: Recurso inexistente -> error explícito, cero fallbacks.
 * - M3. NO-UI MUTATION: Rechaza dependencias del estado visual de InDesign.
 * - M4. SAFE DOM TRAPPING: Errores internos del DOM se encapsulan, evitando crashes del host.
 * - M5. WORKSPACE BINDING: Mutaciones exclusivas al workspace autorizado.
 * - M6. ATOMIC MUTATION: Fallo a mitad de operación no deja estado residual (Todo o Nada).
 */

'use strict';

const PhysicalMutationEngine = require('../../../src/validadores/E25/PhysicalMutationEngine');

describe('E25.3 — Physical Mutation Contract', () => {

    // Simula el estado interno físico de InDesign (Memoria, Documentos abiertos, Estilos)
    let mockInDesignHost;

    const baseCommand = Object.freeze({
        commandId: 'CMD_001',
        jobIdentity: 'JOB_LEX_001',
        executionId: 'EXEC_001',
        sessionId: 'SESSION_999',
        targetWorkspace: 'WS_001'
    });

    beforeEach(() => {
        mockInDesignHost = {
            activeSessionId: 'SESSION_999',
            activeWorkspaceId: 'WS_001',
            resources: {
                paragraphStyles: ['Titulo_Articulo', 'Texto_Normal']
            },
            dom: {
                textFrames: []
            },
            // Simula comportamiento de UI (selección de usuario)
            ui: {
                selection: null 
            }
        };
    });

    test('E25.3.1 SUCCESS_CORRELATED: Mutación válida retorna correlación tridimensional', () => {
        const cmd = { ...baseCommand, payload: { primitiveType: 'CREATE_TEXT_FRAME', content: 'LexDigital' } };
        
        const result = PhysicalMutationEngine.execute(cmd, mockInDesignHost);
        
        expect(result.status).toBe('SUCCESS');
        expect(result.commandId).toBe(baseCommand.commandId);
        expect(result.executionId).toBe(baseCommand.executionId);
        expect(result.sessionId).toBe(baseCommand.sessionId);
        expect(mockInDesignHost.dom.textFrames.length).toBe(1); // Mutación efectiva
    });

    test('E25.3.2 STRICT_RESOURCE_FAILURE: Recurso inexistente falla sin fallbacks (No "Párrafo Básico")', () => {
        const cmd = { ...baseCommand, payload: { primitiveType: 'APPLY_STYLE', styleName: 'Estilo_Inexistente' } };
        
        const result = PhysicalMutationEngine.execute(cmd, mockInDesignHost);
        
        expect(result.status).toBe('ERROR');
        expect(result.reason).toBe('STYLE_NOT_FOUND');
        expect(result.commandId).toBe(baseCommand.commandId); // Sigue correlacionado
    });

    test('E25.3.3 SAFE_DOM_TRAPPING: Errores internos del DOM no colapsan el host', () => {
        // Inyectamos un fallo simulado en el DOM
        const cmd = { ...baseCommand, payload: { primitiveType: 'TRIGGER_DOM_CRASH' } };
        
        // No debe hacer throw; debe atrapar y devolver estructurado
        const result = PhysicalMutationEngine.execute(cmd, mockInDesignHost);
        
        expect(result.status).toBe('ERROR');
        expect(result.reason).toBe('INDESIGN_DOM_ERROR');
    });

    test('E25.3.4 WORKSPACE_BINDING: Rechaza operar sobre un documento equivocado', () => {
        const cmd = { ...baseCommand, targetWorkspace: 'WS_MALICIOSO_002' };
        
        const result = PhysicalMutationEngine.execute(cmd, mockInDesignHost);
        
        expect(result.status).toBe('ERROR');
        expect(result.reason).toBe('WORKSPACE_MISMATCH');
    });

    test('E25.3.5 NO_UI_DEPENDENCY: Falla si la primitiva intenta usar el clipboard o selección visual', () => {
        mockInDesignHost.ui.selection = 'Texto seleccionado por el usuario';
        
        const cmd = { ...baseCommand, payload: { primitiveType: 'MUTATE_SELECTION' } };
        const result = PhysicalMutationEngine.execute(cmd, mockInDesignHost);
        
        expect(result.status).toBe('ERROR');
        expect(result.reason).toBe('UI_DEPENDENCY_PROHIBITED');
    });

    test('E25.3.6 ATOMIC_MUTATION: Mutación parcial fallida hace rollback absoluto', () => {
        // Un comando compuesto que falla en el paso 2
        const cmd = { ...baseCommand, payload: { primitiveType: 'ATOMIC_COMPOSITE_FAILING' } };
        
        const result = PhysicalMutationEngine.execute(cmd, mockInDesignHost);
        
        expect(result.status).toBe('ERROR');
        expect(result.reason).toBe('PARTIAL_MUTATION_ROLLED_BACK');
        
        // El DOM debe quedar exactamente igual que antes (0 text frames)
        expect(mockInDesignHost.dom.textFrames.length).toBe(0);
    });
});