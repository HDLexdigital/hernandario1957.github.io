/**
 * E23.1 — UXP Execution Contract Suite
 * 
 * Fase: RED
 * 
 * Contrato del Protocolo de Ejecución UXP / IPC:
 * - Valida la estructura estricta del request (requestId, protocolVersion, operation, payload).
 * - Exige el tipado tipificado de las respuestas y la gestión de errores (Error code, message).
 * - Garantiza la inmutabilidad de los objetos de ejecución.
 * - Rechaza solicitudes con contratos malformados lanzando UXP_CONTRACT_VIOLATION.
 */

'use strict';

// El despachador de contratos UXP aún no está implementado (Fase RED esperada)
const UxpContractDispatcher = require('../../../src/validadores/E23/UxpContractDispatcher');

describe('E23.1 — UXP Execution Contract (Fase RED)', () => {

    const validRequest = Object.freeze({
        requestId: 'req-2026-001',
        protocolVersion: '1.0.0',
        operation: 'COMPILE_AST',
        payload: {
            sourcePath: 'salidaXHTML/fragmento.json'
        }
    });

    test('1. REQUEST VALIDATION: Acepta solicitudes que cumplen estrictamente el contrato de protocolo', () => {
        const response = UxpContractDispatcher.dispatch(validRequest);

        expect(response).toBeDefined();
        expect(response.requestId).toBe('req-2026-001');
        expect(response.status).toBe('SUCCESS');
        expect(response.error).toBeNull();
    });

    test('2. CONTRACT VIOLATION: Falla si el requestId o la operation están ausentes', () => {
        const malformedRequest = {
            protocolVersion: '1.0.0',
            payload: {}
            // Falta requestId y operation
        };

        expect(() => {
            UxpContractDispatcher.dispatch(malformedRequest);
        }).toThrow(/UXP_CONTRACT_VIOLATION/);
    });

    test('3. UNSUPPORTED OPERATION: Rechaza operaciones no tipificadas en el protocolo', () => {
        const unknownOpRequest = {
            requestId: 'req-2026-002',
            protocolVersion: '1.0.0',
            operation: 'DESTRUCTIVE_MAGIC_WAND', // No existe en el protocolo
            payload: {}
        };

        const response = UxpContractDispatcher.dispatch(unknownOpRequest);
        expect(response.status).toBe('ERROR');
        expect(response.error.code).toBe('UNSUPPORTED_OPERATION');
    });

    test('4. IMMUTABILITY: El contrato garantiza que la solicitud de entrada no sufra mutaciones', () => {
        const requestSnapshot = JSON.stringify(validRequest);
        
        UxpContractDispatcher.dispatch(validRequest);

        expect(JSON.stringify(validRequest)).toBe(requestSnapshot);
    });

});