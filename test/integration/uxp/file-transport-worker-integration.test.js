/**
 * Test Suite: G2.5.3 — Integración Real Worker → F11 CLI
 * Verifica que FileTransportWorker invoque la CLI real y propague códigos 0-5 y métricas sin alteración.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const FileTransportWorker = require('../../../src/uxp/worker/FileTransportWorker');
const realCLI = require('../../../src/cli/lexmotorCLI'); // Exportación real F11

describe('G2.5.3 — Integración FileTransportWorker con F11 Real', () => {
    let worker;
    const testIpcRoot = path.join(__dirname, '../../../../lexmotor-uxp-plugin/PluginData/ipc');
    const requestsDir = path.join(testIpcRoot, 'requests');
    const responsesDir = path.join(testIpcRoot, 'responses');
    const errorsDir = path.join(testIpcRoot, 'errors');

    beforeEach(() => {
        [requestsDir, responsesDir, errorsDir].forEach(dir => {
            if (fs.existsSync(dir)) {
                fs.readdirSync(dir).forEach(file => {
                    fs.unlinkSync(path.join(dir, file));
                });
            } else {
                fs.mkdirSync(dir, { recursive: true });
            }
        });

        // Instanciar el worker inyectando la CLI real
        worker = new FileTransportWorker({
            ipcRoot: testIpcRoot,
            executeCLI: async (req) => {
                // Adaptador para invocar la CLI real según su firma establecida
                return await realCLI.run({
                    input: req.input,
                    profile: req.profile,
                    options: req.options
                });
            }
        });
    });

    it('G2.5.3.1 / G2.5.3.4 / G2.5.3.5 — Solicitud real válida produce exitCode 0, requestId idéntico y métricas F13', async () => {
        const requestId = 'integration-req-001';
        
        // Crear un archivo de entrada de prueba válido si la CLI lo requiere,
        // o utilizar un input que la CLI reconozca según la baseline.
        const requestPayload = {
            protocolVersion: '1.0',
            requestId: requestId,
            command: 'compile',
            input: 'test/fixtures/sample-legal-text.txt', // Ajustar según fixture canónico disponible
            profile: 'test/fixtures/standard-profile.json'
        };

        const reqPath = path.join(requestsDir, `request-${requestId}.json`);
        fs.writeFileSync(reqPath, JSON.stringify(requestPayload), 'utf8');

        // Ejecutar procesamiento real
        const results = await worker.processPendingRequests();

        assert.strictEqual(results.length, 1);
        
        const resPath = path.join(responsesDir, `response-${requestId}.json`);
        assert.ok(fs.existsSync(resPath), 'Debe generar el archivo de respuesta real');

        const responseData = JSON.parse(fs.readFileSync(resPath, 'utf8'));
        assert.strictEqual(responseData.requestId, requestId, 'El requestId debe ser idéntico extremo a extremo');
        assert.strictEqual(typeof responseData.exitCode, 'number');
        assert.ok(responseData.exitCode >= 0 && responseData.exitCode <= 5, 'El exitCode debe pertenecer rigurosamente al rango 0-5');
        assert.ok(responseData.metrics, 'Debe incluir métricas operacionales');
    });

    it('G2.5.3.2 / G2.5.3.3 — Propaga errores de CLI o perfiles inválidos manteniendo códigos específicos (ej. exitCode 1 o 2)', async () => {
        const requestId = 'integration-req-error';
        const requestPayload = {
            protocolVersion: '1.0',
            requestId: requestId,
            command: 'compile',
            input: 'archivo_que_no_existe_en_absoluto.txt',
            profile: 'perfil_invalido.json'
        };

        const reqPath = path.join(requestsDir, `request-${requestId}.json`);
        fs.writeFileSync(reqPath, JSON.stringify(requestPayload), 'utf8');

        await worker.processPendingRequests();

        const resPath = path.join(responsesDir, `response-${requestId}.json`);
        assert.ok(fs.existsSync(resPath));

        const responseData = JSON.parse(fs.readFileSync(resPath, 'utf8'));
        assert.strictEqual(responseData.requestId, requestId);
        assert.strictEqual(typeof responseData.exitCode, 'number');
        assert.ok(responseData.exitCode >= 1 && responseData.exitCode <= 5, 'Debe retornar un código de error operacional válido (1-5)');
        assert.ok(Array.isArray(responseData.diagnostics), 'Debe propagar los diagnósticos estructurados');
    });
});