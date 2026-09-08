'use strict';

const fs = require('fs');
const path = require('path');

const publicDir = path.join(process.cwd(), 'public');
const outputPath = path.join(publicDir, 'anchors.html');

function readJSON(file) {
    const p = path.join(publicDir, file);
    if (!fs.existsSync(p)) return null;
    try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch {
        return null;
    }
}

const report = readJSON('anchors-report.json');

const status = report && report.status === 'OK' ? 'OK' : (report ? 'ERROR' : 'SIN DATOS');
const generatedAt = report ? report.generatedAt : '';

let itemsHTML = '';
if (report && report.items && report.items.length > 0) {
    itemsHTML = report.items.map(item => {
        const statusClass = item.status === 'OK' ? 'ok' : 'error';
        return '<li class="' + statusClass + '">' +
               '<strong>Origen:</strong> ' + item.source + '<br>' +
               'Enlace: ' + item.href + '<br>' +
               'Destino: ' + item.target + ' | Ancla: #' + item.anchor +
               (item.message ? '<br><span style="color:#ef4444;">' + item.message + '</span>' : '') +
               '</li>';
    }).join('');
} else {
    itemsHTML = '<li>No hay anclas internas registradas.</li>';
}

const html = '<!DOCTYPE html>' +
'<html lang="es">' +
'<head>' +
'    <meta charset="UTF-8">' +
'    <meta name="viewport" content="width=device-width, initial-scale=1.0">' +
'    <title>Anclas Internas — LexDigitalHD</title>' +
'    <style>' +
'        body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 2rem; }' +
'        .container { max-width: 900px; margin: 0 auto; }' +
'        h1 { color: #38bdf8; }' +
'        .status { font-size: 1.3rem; font-weight: bold; margin: 1rem 0; }' +
'        .status.ok { color: #22c55e; }' +
'        .status.error { color: #ef4444; }' +
'        .generated { color: #94a3b8; font-size: 0.9rem; margin-bottom: 1rem; }' +
'        ul { list-style: none; padding: 0; }' +
'        li { padding: 0.7rem; border-bottom: 1px solid #334155; }' +
'        li.ok::before { content: "✅ "; }' +
'        li.error::before { content: "❌ "; }' +
'        a { color: #38bdf8; }' +
'    </style>' +
'</head>' +
'<body>' +
'    <div class="container">' +
'        <h1>Anclas Internas</h1>' +
'        <div class="status ' + (status === 'OK' ? 'ok' : 'error') + '">Estado: ' + status + '</div>' +
'        <div class="generated">' + generatedAt + '</div>' +
'        <ul>' + itemsHTML + '</ul>' +
'        <p><a href="index.html">← Volver al inicio</a></p>' +
'    </div>' +
'</body>' +
'</html>';

fs.writeFileSync(outputPath, html, 'utf8');
console.log('✅ public/anchors.html generado.');
