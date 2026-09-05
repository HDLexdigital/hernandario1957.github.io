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
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mvp011-api-'));

    const indicePath = path.join(tmpDir, 'indice.json');
    const manifestPath = path.join(tmpDir, 'manifest.json');

    const indice = [
        {
            documentId: 'TEST-DOC',
            title: 'Documento de prueba',
            url: '#TEST-NODE',
            nodeId: 'TEST-NODE'
        }
    ];

    const manifest = {
        documentId: 'TEST-DOC',
        version: '0.1.0-draft',
        createdAt: new Date().toISOString(),
        artifacts: [
            {
                type: 'web',
                path: 'index.html',
                checksum: 'a'.repeat(64),
                rendererVersion: 'test'
            }
        ]
    };

    fs.writeFileSync(indicePath, JSON.stringify(indice));
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));

    process.env.API_INDICE_PATH = indicePath;
    process.env.API_MANIFEST_PATH = manifestPath;
    process.env.API_PORT = '0';

    const serverScript = path.join(__dirname, '..', 'server.js');
    const child = spawn('node', [serverScript], {
        env: { ...process.env },
        stdio: 'ignore'
    });

    // Esperar un poco a que arranque. Mejor: capturar salida con puerto, pero para prueba simple, esperar 800ms.
    await new Promise(resolve => setTimeout(resolve, 800));

    // El servidor imprime el puerto, pero como stdio ignore, no podemos leerlo. Entonces usamos puerto fijo alternativo.
    child.kill();
    process.env.API_PORT = '3123';
    server = spawn('node', [serverScript], {
        env: { ...process.env },
        stdio: 'ignore'
    });

    baseUrl = 'http://127.0.0.1:3123';
    await new Promise(resolve => setTimeout(resolve, 800));
});

afterAll(() => {
    if (server) server.kill();
    fs.rmSync(tmpDir, { recursive: true, force: true });
});

function get(path) {
    return new Promise((resolve, reject) => {
        http.get(baseUrl + path, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data || '{}') }));
        }).on('error', reject);
    });
}

describe('MVP-011 API Server (Read-Only)', () => {
    test('GET /api/v1/status devuelve 200', async () => {
        const res = await get('/api/v1/status');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
    });

    test('GET /api/v1/index devuelve índice', async () => {
        const res = await get('/api/v1/index');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0].nodeId).toBe('TEST-NODE');
    });

    test('GET /api/v1/document/:id devuelve documento', async () => {
        const res = await get('/api/v1/document/TEST-DOC');
        expect(res.status).toBe(200);
        expect(res.body.documentId).toBe('TEST-DOC');
        expect(Array.isArray(res.body.artifacts)).toBe(true);
    });

    test('GET /api/v1/node/:nodeId devuelve nodo', async () => {
        const res = await get('/api/v1/node/TEST-NODE');
        expect(res.status).toBe(200);
        expect(res.body.nodeId).toBe('TEST-NODE');
    });

    test('Ruta inexistente devuelve 404', async () => {
        const res = await get('/api/v1/noexiste');
        expect(res.status).toBe(404);
    });
});
