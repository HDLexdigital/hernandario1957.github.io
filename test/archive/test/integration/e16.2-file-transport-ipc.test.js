/**
 * @fileoverview test/integration/e16.2-file-transport-ipc.test.js
 *
 * E16.2 — Certificación del Transporte Físico IPC (FileTransport)
 * Valida la serialización, correlación por UUID, validación de protocolo y limpieza atómica.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const FileTransport = require('../../src/uxp/transport/FileTransport');

describe('E16.2 — Transporte Físico IPC (File-System Sandbox)', () => {
    let transport;
    let tempIpcRoot;

    beforeEach(() => {
        // Directorio temporal aislado para cada test
        tempIpcRoot = path.join(__dirname, '../../temp-ipc-test-' + Date.now());
        transport = new FileTransport({ ipcRoot: tempIpcRoot });
    });

    afterEach(async () => {
        // Limpieza de infraestructura de prueba del sistema de archivos
        if (fs.existsSync(tempIpcRoot)) {
            fs.rmSync(tempIpcRoot, { recursive: true, force: true });
        }
    });

    test('E16.2-A: Serialización y Escritura de Solicitudes', async () => {
        const payloadMock = { input: 'documento_prueba.json', accion: 'compile' };
        const requestId = await transport.writeRequest(payloadMock);

        expect(requestId).toBeDefined();
        expect(typeof requestId).toBe('string');

        // Verificamos que el archivo físico se creó correctamente con el protocolo correcto
        const filePath = path.join(tempIpcRoot, 'requests', `request-${requestId}.json`);
        expect(fs.existsSync(filePath)).toBe(true);

        const contenido = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        expect(contenido.protocolVersion).toBe('1.0');
        expect(contenido.requestId).toBe(requestId);
        expect(contenido.input).toBe('documento_prueba.json');
        expect(contenido.timestamp).toBeDefined();
    });

    test('E16.2-B: Correlación estricta y Rechazo por RequestId Mismatch', () => {
        const expectedId = 'uuid-correcto-123';
        const badResponse = {
            protocolVersion: '1.0',
            requestId: 'uuid-diferente-999',
            exitCode: 0,
            status: 'SUCCESS'
        };

        // Debe lanzar un error si el UUID de la respuesta no coincide con el esperado
        expect(() => {
            transport.validateResponse(badResponse, expectedId);
        }).toThrow(/RequestId mismatch/);
    });
	
	test('E16.2-C: Timeout determinista y controlado', async () => {
        const requestId = await transport.writeRequest({ accion: 'bloqueada_sin_respuesta' });
        
        const startTime = Date.now();
        
        // Inyectamos un timeout corto (50ms) para certificar el comportamiento 
        // sin bloquear la suite de pruebas durante los 30 segundos productivos.
        await expect(transport.readResponse(requestId, 50)).rejects.toThrow(
            new RegExp(`Timeout esperando la respuesta para requestId: ${requestId}`)
        );
        
        const duration = Date.now() - startTime;

        // Verificamos que el fallo ocurrió inmediatamente, validando el control determinista
        expect(duration).toBeLessThan(1000);
    });
	
    test('E16.2-E: Ciclo de vida y Limpieza atómica (Cleanup)', async () => {
        const requestId = await transport.writeRequest({ accion: 'test' });
        
        const reqPath = path.join(tempIpcRoot, 'requests', `request-${requestId}.json`);
        const resPath = path.join(tempIpcRoot, 'responses', `response-${requestId}.json`);

        // Simulamos que el worker ya creó la respuesta
        fs.writeFileSync(resPath, JSON.stringify({
            protocolVersion: '1.0',
            requestId,
            exitCode: 0,
            status: 'SUCCESS'
        }));

        expect(fs.existsSync(reqPath)).toBe(true);
        expect(fs.existsSync(resPath)).toBe(true);

        // Ejecutamos la limpieza del transporte
        await transport.cleanup(requestId);

        // Verificamos que ambos artefactos temporales fueron eliminados del disco
        expect(fs.existsSync(reqPath)).toBe(false);
        expect(fs.existsSync(resPath)).toBe(false);
    });
});