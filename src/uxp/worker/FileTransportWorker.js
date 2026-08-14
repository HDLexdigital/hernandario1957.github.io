const fs = require('fs');
const path = require('path');

class FileTransportWorker {
    constructor(options = {}) {
        if (typeof options.executeCLI !== 'function') {
            throw new TypeError('FileTransportWorker requiere una función executeCLI inyectada');
        }

        this.executeCLI = options.executeCLI;
        this.ipcRoot = options.ipcRoot || path.join(process.cwd(), 'lexmotor-uxp-plugin', 'PluginData', 'ipc');
        this.requestsDir = path.join(this.ipcRoot, 'requests');
        this.responsesDir = path.join(this.ipcRoot, 'responses');
        this.errorsDir = path.join(this.ipcRoot, 'errors');

        this.ensureDirectories();
    }

    ensureDirectories() {
        [this.requestsDir, this.responsesDir, this.errorsDir].forEach((directory) => {
            if (!fs.existsSync(directory)) {
                fs.mkdirSync(directory, { recursive: true });
            }
        });
    }

    async processRequest(requestId) {
        if (!requestId || typeof requestId !== 'string') {
            throw new TypeError('requestId debe ser una cadena válida');
        }

        const requestPath = path.join(this.requestsDir, `request-${requestId}.json`);
        if (!fs.existsSync(requestPath)) {
            throw new Error(`Solicitud no encontrada para requestId: ${requestId}`);
        }

        let request;
        try {
            const raw = await fs.promises.readFile(requestPath, 'utf8');
            request = JSON.parse(raw);
        } catch (error) {
            return this.writeErrorResponse(requestId, `Solicitud JSON corrupta: ${error.message}`);
        }

        if (request.requestId !== requestId) {
            return this.writeErrorResponse(requestId, `RequestId mismatch: esperado ${requestId}, recibido ${request.requestId}`);
        }

        let result;
        try {
            result = await this.executeCLI(request);
        } catch (error) {
            result = { exitCode: 4, status: 'ERROR', diagnostics: [{ level: 'ERROR', message: error.message }] };
        }

        const response = {
            protocolVersion: request.protocolVersion || '1.0',
            requestId,
            exitCode: result.exitCode,
            status: result.status,
            diagnostics: result.diagnostics || [],
            metrics: result.metrics || {}
        };

        await this.writeResponse(requestId, response);
        return response;
    }

    async writeResponse(requestId, response) {
        const responsePath = path.join(this.responsesDir, `response-${requestId}.json`);
        await fs.promises.writeFile(responsePath, JSON.stringify(response, null, 2), 'utf8');
        return responsePath;
    }

    async writeErrorResponse(requestId, message) {
        const response = {
            protocolVersion: '1.0',
            requestId,
            exitCode: 1,
            status: 'ERROR',
            diagnostics: [{ level: 'ERROR', message }],
            metrics: {}
        };
        await this.writeResponse(requestId, response);
        return response;
    }

    async processPendingRequests() {
        const files = await fs.promises.readdir(this.requestsDir);
        const requestFiles = files.filter(file => /^request-.+\.json$/.test(file));
        const results = [];

        for (const file of requestFiles) {
            const requestId = file.replace(/^request-/, '').replace(/\.json$/, '');
            results.push(await this.processRequest(requestId));
            // Eliminar el archivo procesado para evitar reprocesamiento
            await fs.promises.unlink(path.join(this.requestsDir, file));
        }
        return results;
    }
}

// ESTA LÍNEA ES LA CLAVE QUE ESTABA FALLANDO:
module.exports = FileTransportWorker;