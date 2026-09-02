/**
 * E25.5.1 — Style Identity & Resolution Contract Suite
 * 
 * Fase: RED / IMPLEMENTATION
 * 
 * Contrato de Identidad y Resolución Tipográfica (Paragraph & Character):
 * - S1. STYLE IDENTITY: Resuelve inequívocamente al estilo físico autorizado (separando Paragraph de Character).
 * - S2. STRICT MISSING STYLE: Estilo ausente produce STYLE_NOT_FOUND con cero fallbacks (prohibido [Párrafo Básico]).
 * - S3. SEMANTIC TRACEABILITY: Preserva el mapeo de nodeId, styleId y styleKind sin mutaciones implícitas.
 * - S6. ATOMIC APPLICATION: Fallo al aplicar el estilo revoca la mutación parcial.
 * - S7. NO-UI RELIANCE: Resolución directa sobre el DOM físico, ajena a menús o selecciones visuales.
 * - S9. IDEMPOTENT PROJECTION: Aplicar dos veces el mismo estilo es idempotente y limpio.
 */

'use strict';

const StyleResolutionEngine = require('../../../src/validadores/E25/StyleResolutionEngine');

describe('E25.5.1 — Style Identity & Resolution Contract', () => {

    let mockInDesignHost;

    const baseCommand = Object.freeze({
        commandId: 'CMD_STYLE_001',
        executionId: 'EXEC_001',
        sessionId: 'SESSION_999',
        targetWorkspace: 'WS_001',
        nodeId: 'NODE_ART_1'
    });

    beforeEach(() => {
        mockInDesignHost = {
            activeWorkspaceId: 'WS_001',
            resources: {
                paragraphStyles: {
                    'Titulo_Articulo': { id: 'Titulo_Articulo', kind: 'PARAGRAPH', exportedTag: 'h1' },
                    'Texto_Cuerpo': { id: 'Texto_Cuerpo', kind: 'PARAGRAPH', exportedTag: 'p' }
                },
                characterStyles: {
                    'Negrita_Legal': { id: 'Negrita_Legal', kind: 'CHARACTER', exportedTag: 'strong' }
                }
            },
            dom: {
                targetNodeStyle: null
            }
        };
    });

    test('S1. STYLE IDENTITY: Resuelve correctamente ParagraphStyle y CharacterStyle sin confusión', () => {
        const cmdPara = { 
            ...baseCommand, 
            payload: { styleId: 'Titulo_Articulo', styleKind: 'PARAGRAPH' } 
        };
        const cmdChar = { 
            ...baseCommand, 
            payload: { styleId: 'Negrita_Legal', styleKind: 'CHARACTER' } 
        };

        const resPara = StyleResolutionEngine.resolveAndApply(cmdPara, mockInDesignHost);
        const resChar = StyleResolutionEngine.resolveAndApply(cmdChar, mockInDesignHost);

        expect(resPara.status).toBe('SUCCESS');
        expect(resPara.resolvedStyle.id).toBe('Titulo_Articulo');
        expect(resPara.resolvedStyle.kind).toBe('PARAGRAPH');

        expect(resChar.status).toBe('SUCCESS');
        expect(resChar.resolvedStyle.id).toBe('Negrita_Legal');
        expect(resChar.resolvedStyle.kind).toBe('CHARACTER');
    });

    test('S2. STRICT MISSING STYLE: Estilo inexistente lanza STYLE_NOT_FOUND sin fallbacks', () => {
        const cmd = { 
            ...baseCommand, 
            payload: { styleId: 'Estilo_Fantasma_Inexistente', styleKind: 'PARAGRAPH' } 
        };

        const result = StyleResolutionEngine.resolveAndApply(cmd, mockInDesignHost);

        expect(result.status).toBe('ERROR');
        expect(result.reason).toBe('STYLE_NOT_FOUND');
        // Verificamos que no se mutó el DOM de manera predeterminada
        expect(mockInDesignHost.dom.targetNodeStyle).toBeNull();
    });

    test('S3 & S8. SEMANTIC TRACEABILITY: La respuesta preserva la correlación y trazabilidad', () => {
        const cmd = { 
            ...baseCommand, 
            payload: { styleId: 'Texto_Cuerpo', styleKind: 'PARAGRAPH' } 
        };

        const result = StyleResolutionEngine.resolveAndApply(cmd, mockInDesignHost);

        expect(result.commandId).toBe('CMD_STYLE_001');
        expect(result.executionId).toBe('EXEC_001');
        expect(result.sessionId).toBe('SESSION_999');
        expect(result.nodeId).toBe('NODE_ART_1');
        expect(result.styleId).toBe('Texto_Cuerpo');
    });

    test('S6. ATOMIC APPLICATION: Si ocurre un fallo en la vinculación física, se revoca', () => {
        // Simulamos un comando defectuoso que provoca excepción interna tras resolver
        const cmd = { 
            ...baseCommand, 
            payload: { styleId: 'Titulo_Articulo', styleKind: 'PARAGRAPH', simulateCrash: true } 
        };

        mockInDesignHost.dom.targetNodeStyle = 'ESTILO_ORIGINAL';

        const result = StyleResolutionEngine.resolveAndApply(cmd, mockInDesignHost);

        expect(result.status).toBe('ERROR');
        expect(result.reason).toBe('STYLE_APPLICATION_ROLLED_BACK');
        // El estado original del DOM se preserva intacto gracias a la atomicidad
        expect(mockInDesignHost.dom.targetNodeStyle).toBe('ESTILO_ORIGINAL');
    });

    test('S9. IDEMPOTENT PROJECTION: Aplicar el mismo estilo dos veces produce el mismo estado limpiamente', () => {
        const cmd = { 
            ...baseCommand, 
            payload: { styleId: 'Texto_Cuerpo', styleKind: 'PARAGRAPH' } 
        };

        const firstRun = StyleResolutionEngine.resolveAndApply(cmd, mockInDesignHost);
        const secondRun = StyleResolutionEngine.resolveAndApply(cmd, mockInDesignHost);

        expect(firstRun.status).toBe('SUCCESS');
        expect(secondRun.status).toBe('SUCCESS');
        expect(mockInDesignHost.dom.targetNodeStyle.id).toBe('Texto_Cuerpo');
    });
});