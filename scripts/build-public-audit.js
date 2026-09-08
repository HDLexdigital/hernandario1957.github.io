'use strict';

const fs = require('fs');
const path = require('path');

const publicDir = path.join(process.cwd(), 'public');
const outputPath = path.join(publicDir, 'audit.html');

function readJSON(file) {
    const p = path.join(publicDir, file);
    if (!fs.existsSync(p)) return null;
    try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch {
        return null;
    }
}

const summary = readJSON('audit-summary.json');

const status = summary && summary.status === 'OK' ? 'OK' : (summary ? 'ERROR' : 'SIN DATOS');
const generatedAt = summary ? summary.generatedAt : '';

function card(title, state, total, errors, link) {
    const statusClass = state === 'OK' ? 'ok' : (state === 'SIN DATOS' ? 'missing' : 'error');
    return '<div class="card ' + statusClass + '">' +
           '<div class="card-title">' + title + '</div>' +
           '<div class="card-status">' + state + '</div>' +
           '<div class="card-count">' + errors + ' / ' + total + ' errores</div>' +
           (link ? '<a href="' + link + '">Ver detalle</a>' : '') +
           '</div>';
}

const cardsHTML = summary
    ? card('Integridad', summary.reports.integrity, summary.counts.integrityTotal, summary.counts.integrityErrors, 'integrity.html') +
      card('Enlaces Externos', summary.reports.externalLinks, summary.counts.externalLinksTotal, summary.counts.externalLinksErrors, 'external-links.html') +
      card('Anclas Internas', summary.reports.anchors, summary.counts.anchorsTotal, summary.counts.anchorsErrors, 'anchors.html')
    : '<p>No hay resumen de auditoría disponible.</p>';

const html = '<!DOCTYPE html>' +
'<html lang="es">' +
'<head>' +
'    <meta charset="UTF-8">' +
'    <meta name="viewport" content="width=device-width, initial-scale=1.0">' +
'    <title>Auditoría Consolidada — LexDigitalHD</title>' +
'    <style>' +
'        body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 2rem; }' +
'        .container { max-width: 900px; margin: 0 auto; }' +
'        h1 { color: #38bdf8; }' +
'        .status { font-size: 1.3rem; font-weight: bold; margin: 1rem 0; }' +
'        .status.ok { color: #22c55e; }' +
'        .status.error { color: #ef4444; }' +
'        .generated { color: #94a3b8; font-size: 0.9rem; margin-bottom: 1rem; }' +
'        .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }' +
'        .card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 1rem; }' +
'        .card.ok { border-left: 4px solid #22c55e; }' +
'        .card.error { border-left: 4px solid #ef4444; }' +
'        .card.missing { border-left: 4px solid #f59e0b; }' +
'        .card-title { color: #94a3b8; font-size: 0.9rem; }' +
'        .card-status { font-size: 1.2rem; font-weight: bold; margin: 0.5rem 0; }' +
'        .card-count { color: #cbd5e1; font-size: 0.9rem; }' +
'        a { color: #38bdf8; text-decoration: none; }' +
'        a:hover { text-decoration: underline; }' +
'    </style>' +
'</head>' +
'<body>' +
'    <div class="container">' +
'        <h1>Auditoría Consolidada</h1>' +
'        <div class="status ' + (status === 'OK' ? 'ok' : 'error') + '">Estado: ' + status + '</div>' +
'        <div class="generated">' + generatedAt + '</div>' +
'        <div class="cards">' + cardsHTML + '</div>' +
'        <p><a href="index.html">← Volver al inicio</a></p>' +
'    </div>' +
'</body>' +
'</html>';

fs.writeFileSync(outputPath, html, 'utf8');
console.log('✅ public/audit.html generado.');
