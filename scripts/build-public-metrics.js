'use strict';

const fs = require('fs');
const path = require('path');

const publicDir = path.join(process.cwd(), 'public');
const outputPath = path.join(publicDir, 'metrics.html');

function readJSON(file) {
    const p = path.join(publicDir, file);
    if (!fs.existsSync(p)) return null;
    try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch {
        return null;
    }
}

const metrics = readJSON('build-metrics.json');

let metricsHTML = '';
if (metrics) {
    metricsHTML = '<p>Documentos: ' + (metrics.totalDocuments || 'N/D') + '</p>' +
                  '<p>Versiones: ' + (metrics.totalVersions || 'N/D') + '</p>' +
                  '<p>Core: ' + (metrics.coreVersion || 'N/D') + '</p>' +
                  '<p>LEDM: ' + (metrics.ledmVersion || 'N/D') + '</p>';
} else {
    metricsHTML = '<p>No hay métricas de compilación disponibles.</p>';
}

const html = '<!DOCTYPE html>' +
'<html lang="es">' +
'<head>' +
'    <meta charset="UTF-8">' +
'    <meta name="viewport" content="width=device-width, initial-scale=1.0">' +
'    <title>Métricas — LexDigitalHD</title>' +
'    <style>' +
'        body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 2rem; }' +
'        .container { max-width: 900px; margin: 0 auto; }' +
'        h1 { color: #38bdf8; }' +
'        p { margin: 0.5rem 0; }' +
'        a { color: #38bdf8; }' +
'    </style>' +
'</head>' +
'<body>' +
'    <div class="container">' +
'        <h1>Métricas de Compilación</h1>' +
'        ' + metricsHTML + '' +
'        <p><a href="index.html">← Volver al inicio</a></p>' +
'    </div>' +
'</body>' +
'</html>';

fs.writeFileSync(outputPath, html, 'utf8');
console.log('✅ public/metrics.html generado.');
