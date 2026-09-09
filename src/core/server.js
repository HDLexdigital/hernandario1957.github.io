'use strict';

const http = require('http');
const { exec } = require('child_process');
const { iniciarHeartbeat } = require('./heartbeat');
const { iniciarWatchdog } = require('./watchdog');

const PORT = process.env.LEXDIGITAL_PORT || 8765;
const HOST = '127.0.0.1';
const RAIZ = __dirname + '/../..';

const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'OK', service: 'lexdigital-pipeline', timestamp: new Date().toISOString() }));
        return;
    }

    if (req.url === '/build' && req.method === 'POST') {
        console.log('📦 Build solicitado desde HTTP');
        exec('npm run build:public', { cwd: RAIZ, timeout: 120000 }, (error, stdout, stderr) => {
            const response = {
                status: error ? 'ERROR' : 'OK',
                stdout,
                stderr,
                timestamp: new Date().toISOString()
            };
            res.writeHead(error ? 500 : 200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response, null, 2));
        });
        return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not_found' }));
});

server.listen(PORT, HOST, () => {
    console.log(`✅ LexDigital Pipeline escuchando en http://${HOST}:${PORT}`);
    iniciarHeartbeat();
    iniciarWatchdog();
});

module.exports = server;
