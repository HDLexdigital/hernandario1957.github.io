/**
 * Test Suite: G2.5.2 — FileTransportWorker
 * Verifica la correcta orquestación del worker IPC mediante dependencias inyectadas (executeCLI).
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const FileTransportWorker = require('../../../src/uxp/worker/FileTransportWorker');

describe('G2.5.2 — FileTransportWorker (Adaptador IPC Periférico)', () => {
    let worker;
    const testIpcRoot = path.join(__dirname, '../../../../lexmotor-uxp-plugin/PluginData/ipc');
    const requestsDir = path.join(testIpcRoot, 'requests');
    const responsesDir = path.join(testIpcRoot, 'responses');
    const errorsDir = path.join(testIpcRoot, 'errors');

    beforeEach(() => {
        // Limpiar directorios de IPC para cada prueba
        [requestsDir, responsesDir, errorsDir].forEach(dir => {
            if (fs.existsSync(dir)) {
                fs.readdirSync(dir).forEach(file => {
                    fs.unlinkSync(path.join(dir, file));
                });
            }
        });
    });

    it('G2.5.2.1 — Requiere una función executeCLI inyectada en el constructor', () => {
        assert.throws(() => {
            new FileTransportWorker({ ipcRoot: testIpcRoot });
        }, /requiere una función executeCLI inyectada/);
    });

    it('G2.5.2.2 — Procesa una solicitud válida, invoca executeCLI y escribe la respuesta correlacionada', async () => {
        let invokedWith = null;
        const mockExecuteCLI = async (req) => {
            invokedWith = req;
            return {
                exitCode: 0,
                status: 'SUCCESS',
                diagnostics: [],
                metrics: { durationMs: 12 }
            };
        };

        worker = new FileTransportWorker({
            ipcRoot: testIpcRoot,
            executeCLI: mockExecuteCLI
        });

        const requestId = 'test-req-001';
        const payload = {
            protocolVersion: '1.0',
            requestId: requestId,
            command: 'compile',
            input: 'sample.json'
        };

        const reqPath = path.join(requestsDir, `request-${requestId}.json`);
        fs.writeFileSync(reqPath, JSON.stringify(payload), 'utf8');

        const results = await worker.processPendingRequests();

        assert.strictEqual(results.length, 1);
        assert.deepStrictEqual(invokedWith, payload);

        const resPath = path.join(responsesDir, `response-${requestId}.json`);
        assert.ok(fs.existsSync(resPath), 'Debe crear el archivo de respuesta');

        const responseData = JSON.parse(fs.readFileSync(resPath, 'utf8'));
        assert.strictEqual(responseData.requestId, requestId);
        assert.strictEqual(responseData.exitCode, 0);
        assert.strictEqual(responseData.status, 'SUCCESS');
    });

    it('G2.5.2.3 — Maneja solicitudes con JSON corrupto escribiendo una respuesta de error controlada', async () => {
        const mockExecuteCLI = async () => ({ exitCode: 0, status: 'SUCCESS' });
        worker = new FileTransportWorker({
            ipcRoot: testIpcRoot,
            executeCLI: mockExecuteCLI
        });

        const requestId = 'test-req-corrupt';
        const reqPath = path.join(requestsDir, `request-${requestId}.json`);
        fs.writeFileSync(reqPath, '{ invalid json ...', 'utf8');

        await worker.processPendingRequests();

        const resPath = path.join(responsesDir, `response-${requestId}.json`);
        assert.ok(fs.existsSync(resPath));

        const responseData = JSON.parse(fs.readFileSync(resPath, 'utf8'));
        assert.strictEqual(responseData.requestId, requestId);
        assert.strictEqual(responseData.exitCode, 1);
        assert.strictEqual(responseData.status, 'ERROR');
        assert.ok(responseData.diagnostics[0].message.includes('Solicitud JSON corrupta'));
    });

    it('G2.5.2.4 — Rechaza solicitudes donde el requestId no coincide con el nombre de archivo', async () => {
        const mockExecuteCLI = async () => ({ exitCode: 0, status: 'SUCCESS' });
        worker = new FileTransportWorker({
            ipcRoot: testIpcRoot,
            executeCLI: mockExecuteCLI
        });

        const requestId = 'file-id-123';
        const payload = { requestId: 'mismatch-id-456' };
        const reqPath = path.join(requestsDir, `request-${requestId}.json`);
        fs.writeFileSync(reqPath, JSON.stringify(payload), 'utf8');

        await worker.processPendingRequests();

        const resPath = path.join(responsesDir, `response-${requestId}.json`);
        const responseData = JSON.parse(fs.readFileSync(resPath, 'utf8'));

        assert.strictEqual(responseData.exitCode, 1);
        assert.ok(responseData.diagnostics[0].message.includes('RequestId mismatch'));
    });
});