'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let server;
let baseUrl;
let tmpDir;

beforeAll(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mvp015-auth-'));

    const indicePath = path.join(tmpDir, 'indice.json');
    const manifestPath = path.join(tmpDir, 'manifest.json');
    const searchIndexPath = path.join(tmpDir, 'search-index.json');

    fs.writeFileSync(indicePath, JSON.stringify([{ documentId: 'DOC', title: 'Doc', url: '#N', nodeId: 'N' }]));
    fs.writeFileSync(manifestPath, JSON.stringify({ documentId: 'DOC', version: '1.0.0', artifacts: [] }));
    fs.writeFileSync(searchIndexPath, JSON.stringify([]));

    process.env.API_INDICE_PATH = indicePath;
    process.env.API_MANIFEST_PATH = manifestPath;
    process.env.API_SEARCH_INDEX_PATH = searchIndexPath;
    process.env.LEX_API_KEY = 'test-key-123';
    process.env.API_PORT = '3125';

    const serverScript = path.join(__dirname, '..', '..', 'api', 'server.js');
    server = spawn('node', [serverScript], {
        env: { ...process.env },
        stdio: ['ignore', 'pipe', 'pipe']
    });

    let stderr = '';
    server.stderr.on('data', chunk => { stderr += chunk.toString(); });

    baseUrl = 'http://127.0.0.1:3125';

    // Esperar a que el servidor esté listo o fallar tras 5s
    await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Servidor no arrancó. stderr: ' + stderr));
        }, 5000);

        const interval = setInterval(() => {
            http.get(baseUrl + '/api/v1/status', { headers: { 'x-api-key': 'test-key-123' } }, res => {
                clearInterval(interval);
                clearTimeout(timeout);
                resolve();
            }).on('error', () => {});
        }, 200);
    });
});

afterAll(() => {
    if (server) server.kill();
    fs.rmSync(tmpDir, { recursive: true, force: true });
});

function request(path, headers = {}) {
    return new Promise((resolve, reject) => {
        const req = http.get(baseUrl + path, { headers }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data || '{}') }));
        });
        req.on('error', reject);
    });
}

describe('MVP-015 Auth Middleware', () => {
    test('Devuelve 401 sin API Key', async () => {
        const res = await request('/api/v1/status');
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('unauthorized');
    });

    test('Devuelve 401 con API Key inválida', async () => {
        const res = await request('/api/v1/status', { 'x-api-key': 'wrong' });
        expect(res.status).toBe(401);
    });

    test('Devuelve 200 con API Key válida', async () => {
        const res = await request('/api/v1/status', { 'x-api-key': 'test-key-123' });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
    });
});
