/**
 * test/LexDigitalContractError.test.js
 * Pruebas de la Taxonomía de Errores (C01-05)
 */
const { LexDigitalContractError } = require('../../../src/errores/LexDigitalContractError.js');

describe('C01-05 LexDigitalContractError', () => {

    test('1. ERR-INV-01: Instanciación correcta crea estructura auditable', () => {
        const error = new LexDigitalContractError({
            code: 'ERR-001_STYLE_NOT_REGISTERED',
            contractId: 'C01-04',
            contractVersion: '1.0.0',
            message: 'Estilo no registrado en el mapping',
            details: { styleName: 'P99_INVENTADO' }
        });

        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('LexDigitalContractError');
        expect(error.code).toBe('ERR-001_STYLE_NOT_REGISTERED');
        expect(error.details.styleName).toBe('P99_INVENTADO');
        // Validar formato ISO 8601 del timestamp
        expect(new Date(error.timestamp).toISOString()).toBe(error.timestamp);
    });

    test('2. toJSON() serializa estrictamente el contrato para logs', () => {
        const opciones = {
            code: 'ERR-003_OUTPUT_PROFILE_INVALID',
            contractId: 'C01-04',
            contractVersion: '1.0.0',
            message: 'Perfil inválido',
            details: { perfil: 'PDF' }
        };
        const error = new LexDigitalContractError(opciones);
        const json = error.toJSON();

        expect(json.code).toBe(opciones.code);
        expect(json.contractId).toBe(opciones.contractId);
        expect(json.message).toBe(opciones.message);
        expect(json).toHaveProperty('timestamp');
        // Aseguramos que la traza de Node no contamine el JSON auditable
        expect(json.stack).toBeUndefined(); 
    });

    test('3. Salvaguarda de Implementación: Exige parámetros contractuales mínimos', () => {
        expect(() => {
            new LexDigitalContractError({ message: "Solo mensaje" });
        }).toThrow(/requiere code, contractId y contractVersion/);
    });
});
