/**
 * E24.5.1 — Host Readiness Contract Suite
 * 
 * Fase: RED / IMPLEMENTATION
 * 
 * Contrato de Preparación del Host Físico (InDesign):
 * - A. SUCCESS: Host válido responde y produce READY.
 * - B. NOT COMPATIBLE: Aplicación/versión incorrecta produce HOST_NOT_COMPATIBLE.
 * - C. UNAVAILABLE: Host inalcanzable produce HOST_UNAVAILABLE.
 * - D. TIMEOUT: Falta de respuesta en tiempo límite produce HOST_READINESS_TIMEOUT.
 * - E. MALFORMED: Respuesta sin estructura IPC/UXP produce HOST_MALFORMED_RESPONSE.
 * - F. PROTOCOL MISMATCH: Versión de protocolo IPC incorrecta produce HOST_PROTOCOL_MISMATCH.
 * - G. IDENTITY IMMUTABLE: El jobIdentity se preserva inmutable.
 * - H. EXECUTION CORRELATION: executionId correlaciona la sonda con la respuesta.
 * - I. NO MUTATION: El reporte de readiness confirma 0 operaciones de escritura (observacional).
 * - J. TELEMETRY EXCLUSION: Telemetría (latencia/timestamps) no muta el resultado canónico.
 */

'use strict';

const HostReadinessEngine = require('../../../src/validadores/E24/HostReadinessEngine');

describe('E24.5.1 — Host Readiness Contract', () => {

    const baseContext = Object.freeze({
        jobIdentity: 'JOB_LEX_ALPHA_001',
        executionId: 'EXEC_001',
        requirements: {
            application: 'Adobe InDesign',
            minVersion: 19.0, // Equivalente a InDesign 2024+
            protocol: 'LEX_UXP_IPC_V1'
        }
    });

    const mockValidHostResponse = {
        application: 'Adobe InDesign',
        version: 19.2,
        environment: 'UXP',
        protocol: 'LEX_UXP_IPC_V1',
        mutations: 0,
        telemetry: { timestamp: '2026-08-22T05:00:00Z', latencyMs: 15 }
    };

    test('A. SUCCESS: Host válido produce estado READY', async () => {
        const mockProbe = async () => mockValidHostResponse;
        
        const result = await HostReadinessEngine.probe(baseContext, mockProbe);
        
        expect(result.status).toBe('READY');
        expect(result.readiness.liveness).toBe(true);
        expect(result.readiness.compatibleVersion).toBe(true);
    });

    test('B. NOT COMPATIBLE: Versión inferior o aplicación incorrecta produce HOST_NOT_COMPATIBLE', async () => {
        const mockProbe = async () => ({ ...mockValidHostResponse, version: 18.0 });
        
        const result = await HostReadinessEngine.probe(baseContext, mockProbe);
        
        expect(result.status).toBe('NOT_READY');
        expect(result.reason).toBe('HOST_NOT_COMPATIBLE');
    });

    test('C. UNAVAILABLE: Host inalcanzable produce HOST_UNAVAILABLE', async () => {
        const mockProbe = async () => { throw new Error('CONNECTION_REFUSED'); };
        
        const result = await HostReadinessEngine.probe(baseContext, mockProbe);
        
        expect(result.status).toBe('NOT_READY');
        expect(result.reason).toBe('HOST_UNAVAILABLE');
    });

    test('D. TIMEOUT: Falta de respuesta produce HOST_READINESS_TIMEOUT', async () => {
        const mockProbe = () => new Promise((resolve, reject) => {
            setTimeout(() => reject(new Error('TIMEOUT_EXCEEDED')), 50);
        });
        
        const result = await HostReadinessEngine.probe(baseContext, mockProbe);
        
        expect(result.status).toBe('NOT_READY');
        expect(result.reason).toBe('HOST_READINESS_TIMEOUT');
    });

    test('E. MALFORMED: Respuesta sin campos requeridos produce HOST_MALFORMED_RESPONSE', async () => {
        const mockProbe = async () => ({ status: 'ok', something: 'else' }); // Falta application, version, etc.
        
        const result = await HostReadinessEngine.probe(baseContext, mockProbe);
        
        expect(result.status).toBe('NOT_READY');
        expect(result.reason).toBe('HOST_MALFORMED_RESPONSE');
    });

    test('F. PROTOCOL MISMATCH: Versión IPC incorrecta produce HOST_PROTOCOL_MISMATCH', async () => {
        const mockProbe = async () => ({ ...mockValidHostResponse, protocol: 'OLD_CEP_V3' });
        
        const result = await HostReadinessEngine.probe(baseContext, mockProbe);
        
        expect(result.status).toBe('NOT_READY');
        expect(result.reason).toBe('HOST_PROTOCOL_MISMATCH');
    });

    test('G & H. IDENTITY CORRELATION: jobIdentity inmutable, executionId correlacionado', async () => {
        const mockProbe = async () => mockValidHostResponse;
        
        const result = await HostReadinessEngine.probe(baseContext, mockProbe);
        
        expect(result.jobIdentity).toBe('JOB_LEX_ALPHA_001');
        expect(result.executionId).toBe('EXEC_001');
    });

    test('I. NO MUTATION: La sonda rechaza reportes que indiquen mutación de estado', async () => {
        const mockProbe = async () => ({ ...mockValidHostResponse, mutations: 1 });
        
        const result = await HostReadinessEngine.probe(baseContext, mockProbe);
        
        expect(result.status).toBe('NOT_READY');
        expect(result.reason).toBe('HOST_STATE_MUTATED_DURING_PROBE');
    });

    test('J. TELEMETRY EXCLUSION: Telemetría separada lógicamente de los invariantes canónicos', async () => {
        const mockProbe = async () => mockValidHostResponse;
        
        const result = await HostReadinessEngine.probe(baseContext, mockProbe);
        
        expect(result.telemetry).toBeDefined();
        expect(result.readiness.liveness).toBe(true);
        // Telemetría no contamina los booleanos lógicos de readiness
    });
});