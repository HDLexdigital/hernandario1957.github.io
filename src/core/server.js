'use strict';

const http = require('http');
const { spawn, exec } = require('child_process');
const { iniciarHeartbeat, detenerHeartbeat } = require('./heartbeat');
const { iniciarWatchdog, detenerWatchdog } = require('./watchdog');
const { construirXHTMLDesdeLEDM } = require('./constructores/xhtml-ledm');
const { validarTodo } = require('./validators/capas');
const { limpiarBOM } = require('./utils/fs');

const PORT = process.env.LEXDIGITAL_PORT || 8765;
const HOST = '127.0.0.1';
const RAIZ = __dirname + '/../..';

const BUILD_TIMEOUT_MS = 120000;
const MAX_BODY_SIZE_BYTES = 5242880;
const CORS_ORIGIN = 'http://127.0.0.1:8765';

let buildEnCurso = false;

function setCORS(res) {
    res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const server = http.createServer((req, res) => {
    setCORS(res);

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
            status: 'OK',
            service: 'lexdigital-pipeline',
            uptime: process.uptime()
        }));
    }

    if (req.method === 'GET' && req.url === '/modular') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
            status: 'OK',
            modulos: ['catalogo', 'timeline', 'metricas', 'dashboards', 'xhtml', 'fs', 'integrity']
        }));
    }

    if (req.method === 'POST' && req.url === '/build') {
        if (buildEnCurso) {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ status: 'ERROR', mensaje: 'build en curso' }));
        }

        buildEnCurso = true;
        exec('npm run build:public', { cwd: RAIZ, timeout: BUILD_TIMEOUT_MS }, (error, stdout, stderr) => {
            buildEnCurso = false;
            res.writeHead(error ? 500 : 200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: error ? 'ERROR' : 'OK',
                stdout: stdout || '',
                stderr: stderr || ''
            }));
        });
        return;
    }

    if (req.method === 'GET' && req.url === '/build-stream') {
        if (buildEnCurso) {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ status: 'ERROR', mensaje: 'build en curso' }));
        }

        buildEnCurso = true;

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        const isWin = process.platform === 'win32';
        const cmd = isWin ? 'npm.cmd' : 'npm';
        const buildProcess = spawn(cmd, ['run', 'build:public'], { cwd: RAIZ, detached: true });

        let finalizado = false;

        const sendEvent = (type, message) => {
            res.write(`data: ${JSON.stringify({ type, message })}\n\n`);
        };

        const finalizar = (estado, mensaje) => {
            if (finalizado) return;
            finalizado = true;
            buildEnCurso = false;
            sendEvent('done', mensaje || estado);
            try { res.end(); } catch (_) {}
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

        buildProcess.on('error', (err) => {
            sendEvent('error', 'spawn error: ' + err.message);
            finalizar('FAILED', 'Proceso no pudo iniciarse');
        });

        buildProcess.on('close', (code) => {
            finalizar('FINISHED', 'Proceso finalizado con código ' + code);
        });

        req.on('close', () => {
            if (!finalizado) {
                try { process.kill(-buildProcess.pid, 'SIGINT'); } catch (_) {}
                finalizar('TERMINATED', 'Cliente desconectado');
            }
        });

        return;
    }

    if (req.method === 'POST' && req.url === '/render') {
        let body = '';
        let excedido = false;

        req.on('data', chunk => {
            if (excedido) return;
            body += chunk;
            if (body.length > MAX_BODY_SIZE_BYTES) {
                excedido = true;
                res.writeHead(413, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ERROR', mensaje: 'body demasiado grande' }));
                req.destroy();
            }
        });

        req.on('end', () => {
            if (excedido) return;
            let ledm;
            try {
                ledm = JSON.parse(limpiarBOM(body));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ status: 'ERROR', mensaje: 'JSON inválido' }));
            }

            try {
                const validacion = validarTodo(ledm);
                if (!validacion.ok) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ status: 'ERROR', validacion }));
                }
                const xhtml = construirXHTMLDesdeLEDM(ledm);
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(xhtml);
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ERROR', mensaje: error.message }));
            }
        });
        return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not_found' }));
});

server.listen(PORT, HOST, () => {
    console.log('LexDigital Pipeline escuchando en http://' + HOST + ':' + PORT);
    iniciarHeartbeat();
    iniciarWatchdog();
});


function shutdown() {
    console.log('[server] apagando...');
    detenerHeartbeat();
    detenerWatchdog();
    server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = server;

