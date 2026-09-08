/**
 * Test Suite: G2.5.1 — FileTransport Contract
 * Verifica las invariantes del transporte basado en archivos (IPC) sin acoplamiento a la baseline.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const FileTransport = require('../../../src/uxp/transport/FileTransport');

describe('G2.5.1 — Contrato FileTransport (IPC por Archivos)', () => {
    let transport;
    const testIpcRoot = path.join(__dirname, '../../../../lexmotor-uxp-plugin/PluginData/ipc');

    beforeEach(() => {
        transport = new FileTransport({ ipcRoot: testIpcRoot });
        // Limpiar directorios de prueba si existen
        [
            path.join(testIpcRoot, 'requests'),
            path.join(testIpcRoot, 'responses'),
            path.join(testIpcRoot, 'errors')
        ].forEach(dir => {
            if (fs.existsSync(dir)) {
                fs.readdirSync(dir).forEach(file => {
                    fs.unlinkSync(path.join(dir, file));
                });
            }
        });
    });

    it('G2.5.1.1 — Genera un requestId único y escribe un JSON válido en requests/', async () => {
        const payload = { command: 'compile', input: 'test.json' };
        const requestId = await transport.writeRequest(payload);

        assert.strictEqual(typeof requestId, 'string');
        assert.ok(requestId.length > 0);

        const expectedPath = path.join(testIpcRoot, 'requests', `request-${requestId}.json`);
        assert.ok(fs.existsSync(expectedPath), 'El archivo de request debe existir en el disco');

        const writtenData = JSON.parse(fs.readFileSync(expectedPath, 'utf8'));
        assert.strictEqual(writtenData.command, 'compile');
        assert.strictEqual(writtenData.requestId, requestId);
        assert.deepStrictEqual(writtenData.input, 'test.json');
    });

    it('G2.5.1.2 — Lee y valida la respuesta asociada exclusivamente al requestId', async () => {
        const requestId = 'test-req-12345';
        const responseData = {
            protocolVersion: '1.0',
            requestId: requestId,
            exitCode: 0,
            status: 'SUCCESS',
            diagnostics: [],
            metrics: { durationMs: 45 }
        };

        const responsePath = path.join(testIpcRoot, 'responses', `response-${requestId}.json`);
        fs.writeFileSync(responsePath, JSON.stringify(responseData), 'utf8');

        const result = await transport.readResponse(requestId);
        assert.deepStrictEqual(result, responseData);
        assert.strictEqual(result.exitCode, 0);
    });

    it('G2.5.1.3 — Rechaza respuestas corruptas (faltan campos obligatorios)', async () => {
        const requestId = 'test-req-corrupt';
        const corruptedData = {
            protocolVersion: '1.0',
            requestId: requestId,
            // Faltan exitCode y status
        };

        const responsePath = path.join(testIpcRoot, 'responses', `response-${requestId}.json`);
        fs.writeFileSync(responsePath, JSON.stringify(corruptedData), 'utf8');

        await assert.rejects(async () => {
            await transport.readResponse(requestId);
        }, /Respuesta IPC corrupta/);
    });

    it('G2.5.1.5 — Rechaza respuestas con requestId desalineado', async () => {
        const requestId = 'test-req-mismatch';
        const mismatchData = {
            protocolVersion: '1.0',
            requestId: 'other-id', // No coincide
            exitCode: 0,
            status: 'SUCCESS'
        };

        const responsePath = path.join(testIpcRoot, 'responses', `response-${requestId}.json`);
        fs.writeFileSync(responsePath, JSON.stringify(mismatchData), 'utf8');

        await assert.rejects(async () => {
            await transport.readResponse(requestId);
        }, /RequestId mismatch/);
    });
    it('G2.5.1.4 — Realiza el cleanup correcto de request y response', async () => {
        const requestId = 'test-cleanup-999';
        const reqPath = path.join(testIpcRoot, 'requests', `request-${requestId}.json`);
        const resPath = path.join(testIpcRoot, 'responses', `response-${requestId}.json`);

        fs.writeFileSync(reqPath, '{}', 'utf8');
        fs.writeFileSync(resPath, '{}', 'utf8');

        assert.ok(fs.existsSync(reqPath));
        assert.ok(fs.existsSync(resPath));

        await transport.cleanup(requestId);

        assert.strictEqual(fs.existsSync(reqPath), false);
        assert.strictEqual(fs.existsSync(resPath), false);
    });
});