/**
 * FileTransport — Adaptador de IPC basado en archivos para UXP / Node.js
 * Cumple estrictamente con el contrato G2.5.1 (Autoridad de ID y validación robusta).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class FileTransport {
    constructor(options = {}) {
        this.ipcRoot = options.ipcRoot || path.join(process.cwd(), 'lexmotor-uxp-plugin', 'PluginData', 'ipc');
        this.requestsDir = path.join(this.ipcRoot, 'requests');
        this.responsesDir = path.join(this.ipcRoot, 'responses');
        this.errorsDir = path.join(this.ipcRoot, 'errors');

        [this.requestsDir, this.responsesDir, this.errorsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    async writeRequest(payload) {
        const requestId = crypto.randomUUID();
        const fullPayload = {
            protocolVersion: '1.0',
            ...payload,
            requestId,
            timestamp: new Date().toISOString()
        };

        const filePath = path.join(this.requestsDir, `request-${requestId}.json`);
        await fs.promises.writeFile(filePath, JSON.stringify(fullPayload, null, 2), 'utf8');
        return requestId;
    }

    async readResponse(requestId, timeoutMs = 5000) {
        const filePath = path.join(this.responsesDir, `response-${requestId}.json`);
        
        const startTime = Date.now();
        while (!fs.existsSync(filePath)) {
            if (Date.now() - startTime > timeoutMs) {
                throw new Error(`Timeout esperando la respuesta para requestId: ${requestId}`);
            }
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        const rawData = await fs.promises.readFile(filePath, 'utf8');
        let response;
        try {
            response = JSON.parse(rawData);
        } catch (e) {
            throw new Error(`Respuesta JSON corrupta para requestId: ${requestId}`);
        }

        this.validateResponse(response, requestId);
        return response;
    }

    validateResponse(response, expectedRequestId) {
        if (!response || typeof response !== 'object') {
            throw new Error('Respuesta IPC inválida: debe ser un objeto JSON.');
        }

        if (!response.protocolVersion || !response.requestId || response.exitCode === undefined || !response.status) {
            throw new Error('Respuesta IPC corrupta: faltan campos obligatorios (protocolVersion, requestId, exitCode, status).');
        }

        if (response.requestId !== expectedRequestId) {
            throw new Error(`RequestId mismatch: esperado ${expectedRequestId}, recibido ${response.requestId}`);
        }
    }

    async cleanup(requestId) {
        const reqPath = path.join(this.requestsDir, `request-${requestId}.json`);
        const resPath = path.join(this.responsesDir, `response-${requestId}.json`);

        const deletions = [reqPath, resPath].map(async (filePath) => {
            if (fs.existsSync(filePath)) {
                await fs.promises.unlink(filePath);
            }
        });

        await Promise.all(deletions);
    }
}

module.exports = FileTransport;