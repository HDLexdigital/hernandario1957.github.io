/**
 * E23.2 — LexDigital Pipeline Bridge Contract Suite
 * 
 * Fase: RED
 * 
 * Contrato del Puente del Pipeline Editorial:
 * - Conecta las operaciones validadas del protocolo UXP con el motor central de serialización.
 * - Procesa peticiones de compilación de corpus y retorna un resultado estructurado con el XHTML certificado.
 * - Garantiza que el pipeline central actúe como fuente de verdad inalterable.
 */

'use strict';

// El puente del pipeline aún no está implementado (Fase RED esperada)
const PipelineBridge = require('../../../src/validadores/E23/PipelineBridge');

describe('E23.2 — LexDigital Pipeline Bridge Contract (Fase RED)', () => {

    test('1. BRIDGE EXECUTION: Procesa una operación de compilación y retorna el payload XHTML certificado', () => {
        const executionContext = {
            operation: 'COMPILE_AST',
            targetFormat: 'XHTML_STRICT'
        };

        const result = PipelineBridge.execute(executionContext);

        expect(result).toBeDefined();
        expect(result.status).toBe('SUCCESS');
        expect(typeof result.xhtmlOutput).toBe('string');
        expect(result.xhtmlOutput.length).toBeGreaterThan(0);
    });

    test('2. FALLBACK CONTROL: Retorna error tipificado si se solicita un formato no soportado', () => {
        const invalidContext = {
            operation: 'COMPILE_AST',
            targetFormat: 'FORMATO_DESCONOCIDO'
        };

        const result = PipelineBridge.execute(invalidContext);

        expect(result.status).toBe('ERROR');
        expect(result.error.code).toBe('UNSUPPORTED_TARGET_FORMAT');
    });

});