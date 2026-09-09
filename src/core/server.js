'use strict';

const http = require('http');
const { spawn } = require('child_process');
const { iniciarHeartbeat } = require('./heartbeat');
const { iniciarWatchdog } = require('./watchdog');

const PORT = process.env.LEXDIGITAL_PORT || 8765;
const HOST = '127.0.0.1';
const RAIZ = __dirname + '/../..';

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'OK', service: 'lexdigital-pipeline', uptime: process.uptime() }));
        return;
    }

    if (req.method === 'POST' && req.url === '/build') {
        const { exec } = require('child_process');
        exec('npm run build:public', { cwd: RAIZ, timeout: 120000 }, (error, stdout, stderr) => {
            res.writeHead(error ? 500 : 200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: error ? 'ERROR' : 'OK', stdout, stderr }));
        });
        return;
    }

    if (req.method === 'GET' && req.url === '/build-stream') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        const isWin = process.platform === 'win32';
        const cmd = isWin ? 'npm.cmd' : 'npm';
        const buildProcess = spawn(cmd, ['run', 'build:public'], { cwd: RAIZ });

        const sendEvent = (type, message) => {
            res.write(`data: ${JSON.stringify({ type, message })}\n\n`);
        };

        buildProcess.stdout.on('data', (data) => {
            data.toString().split('\n').forEach(line => {
                if (line.trim()) sendEvent('log', line.trim());
            });
        });

        buildProcess.stderr.on('data', (data) => {
            data.toString().split('\n').forEach(line => {
                if (line.trim()) sendEvent('error', line.trim());
            });
        });

        buildProcess.on('close', (code) => {
            sendEvent('done', `Proceso finalizado con código ${code}`);
            res.end();
        });

        req.on('close', () => {
            if (!buildProcess.killed) buildProcess.kill('SIGINT');
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
