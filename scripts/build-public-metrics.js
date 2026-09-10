'use strict';

const fs = require('fs');
const path = require('path');

const publicDir = path.join(process.cwd(), 'public');
const outputPath = path.join(publicDir, 'metrics.html');

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
'        code { background: #1e293b; padding: 0.2rem 0.4rem; border-radius: 4px; }' +
'        a { color: #38bdf8; }' +
'    </style>' +
'</head>' +
'<body>' +
'    <div class="container">' +
'        <h1>Métricas de Compilación</h1>' +
'        <p>Fuente: <code>build-metrics.json</code> y <code>global-timeline.json</code></p>' +
'        <div id="metrics"></div>' +
'        <p><a href="index.html">← Volver al inicio</a></p>' +
'    </div>' +
'    <script>' +
'        fetch("./build-metrics.json")' +
'            .then(function(res) { return res.ok ? res.json() : null; })' +
'            .then(function(metrics) {' +
'                if (!metrics) return;' +
'                var el = document.getElementById("metrics");' +
'                el.innerHTML = "<p>Documentos: " + (metrics.totalDocuments || "N/D") + "</p>" +' +
'                               "<p>Versiones: " + (metrics.totalVersions || "N/D") + "</p>" +' +
'                               "<p>Core: " + (metrics.coreVersion || "N/D") + "</p>" +' +
'                               "<p>LEDM: " + (metrics.ledmVersion || "N/D") + "</p>";' +
'            })' +
'            .catch(function() {});' +
'        fetch("./global-timeline.json")' +
'            .then(function(res) { return res.ok ? res.json() : null; })' +
'            .catch(function() {});' +
'    </script>' +
'</body>' +
'</html>';

fs.writeFileSync(outputPath, html, 'utf8');
console.log('✅ public/metrics.html generado.');
