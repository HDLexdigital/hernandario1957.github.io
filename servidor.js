// servidor.js
// Puente HTTP local para el plugin UXP de LexDigitalHD
const http = require('http');
const { exec } = require('child_process');
const path = require('path');

const PORT = 3000;
const RAIZ = __dirname;

const server = http.createServer((req, res) => {
    // Configurar CORS para permitir peticiones desde UXP
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/api/compilar') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const documento = data.documento;

                if (!documento) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Falta el parámetro "documento"' }));
                    return;
                }

                console.log(`🚀 UXP Trigger: Compilando documento -> ${documento}`);
                
                const comando = `node compilar.js "${documento}"`;
                
                exec(comando, { cwd: RAIZ }, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`❌ Error en compilación: ${error.message}`);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, error: error.message, details: stderr }));
                        return;
                    }

                    console.log(stdout);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        message: 'Compilación industrial completada con éxito',
                        output: stdout 
                    }));
                });

            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'JSON inválido' }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Endpoint no encontrado' }));
    }
});

server.listen(PORT, () => {
    console.log(`🌐 Servidor puente LexDigitalHD activo en http://localhost:${PORT}`);
});