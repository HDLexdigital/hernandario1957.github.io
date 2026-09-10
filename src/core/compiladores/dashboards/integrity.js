'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..', '..', '..');
const PUBLIC_DIR = path.join(RAIZ, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'integrity.html');

function readJSON(file) {
    const p = path.join(PUBLIC_DIR, file);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function generarIntegrity() {
    const report = readJSON('integrity-report.json');
    const metrics = readJSON('build-metrics.json');

    const status = report && report.status === 'OK' ? 'OK' : (report ? 'ERROR' : 'SIN DATOS');

    let artifactsHTML = '';
    if (report && report.artifacts) {
        artifactsHTML = report.artifacts.map(artifact => {
            const statusClass = artifact.exists ? 'ok' : 'error';
            return '<li class="' + statusClass + '">' + artifact.type + ': ' + artifact.href + ' - ' + (artifact.exists ? 'OK' : (artifact.message || 'ROTO')) + '</li>';
        }).join('');
    } else {
        artifactsHTML = '<li>No hay reporte de integridad disponible.</li>';
    }

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
    '    <title>Integridad y Auditoría — LexDigitalHD</title>' +
    '    <style>' +
    '        body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 2rem; }' +
    '        .container { max-width: 900px; margin: 0 auto; }' +
    '        h1 { color: #38bdf8; }' +
    '        .status { font-size: 1.4rem; font-weight: bold; margin: 1rem 0; }' +
    '        .status.ok { color: #22c55e; }' +
    '        .status.error { color: #ef4444; }' +
    '        ul { list-style: none; padding: 0; }' +
    '        li { padding: 0.5rem; border-bottom: 1px solid #334155; }' +
    '        li.ok::before { content: "✅ "; }' +
    '        li.error::before { content: "❌ "; }' +
    '        .section { margin: 2rem 0; }' +
    '    </style>' +
    '</head>' +
    '<body>' +
    '    <div class="container">' +
    '        <h1>Integridad y Auditoría</h1>' +
    '        <div class="status ' + (status === 'OK' ? 'ok' : 'error') + '">Estado: ' + status + '</div>' +
    '        <div class="section"><h2>Artefactos</h2><ul>' + artifactsHTML + '</ul></div>' +
    '        <div class="section"><h2>Métricas de compilación</h2>' + metricsHTML + '</div>' +
    '        <p><a href="index.html">← Volver al inicio</a></p>' +
    '    </div>' +
    '</body>' +
    '</html>';

    fs.writeFileSync(OUTPUT_PATH, html, 'utf8');
    console.log('✅ public/integrity.html generado.');
    return OUTPUT_PATH;
}

module.exports = { generarIntegrity };
