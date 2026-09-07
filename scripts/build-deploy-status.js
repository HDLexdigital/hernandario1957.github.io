'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const publicDir = path.join(process.cwd(), 'public');
const jsonPath = path.join(publicDir, 'deploy-status.json');
const htmlPath = path.join(publicDir, 'deploy-status.html');

function safeExec(cmd) {
    try {
        return execSync(cmd, { encoding: 'utf8' }).trim();
    } catch {
        return 'N/D';
    }
}

function readJSON(file) {
    const p = path.join(publicDir, file);
    if (!fs.existsSync(p)) return null;
    try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch {
        return null;
    }
}

const commit = safeExec('git rev-parse --short HEAD');
const branch = safeExec('git rev-parse --abbrev-ref HEAD');
const lastMessage = safeExec('git log -1 --pretty=%s');

const integrity = readJSON('integrity-report.json');
const metrics = readJSON('build-metrics.json');

const integrityStatus = integrity ? integrity.status : 'SIN DATOS';
const metricsStatus = metrics ? 'OK' : 'SIN DATOS';

const data = {
    commit,
    branch,
    lastMessage,
    generatedAt: new Date().toISOString(),
    integrityStatus,
    metricsStatus,
    domain: 'https://www.lexdigitalhd.com'
};

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
console.log('✅ public/deploy-status.json generado.');

const html = '<!DOCTYPE html>' +
'<html lang="es">' +
'<head>' +
'    <meta charset="UTF-8">' +
'    <meta name="viewport" content="width=device-width, initial-scale=1.0">' +
'    <title>Estado del Despliegue — LexDigitalHD</title>' +
'    <style>' +
'        body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 2rem; }' +
'        .container { max-width: 900px; margin: 0 auto; }' +
'        h1 { color: #38bdf8; }' +
'        .status { font-size: 1.2rem; margin: 0.5rem 0; }' +
'        .status.ok { color: #22c55e; }' +
'        .status.error { color: #ef4444; }' +
'        .section { margin: 2rem 0; }' +
'        .item { padding: 0.4rem 0; border-bottom: 1px solid #334155; }' +
'        .label { color: #94a3b8; margin-right: 0.5rem; }' +
'        a { color: #38bdf8; }' +
'    </style>' +
'</head>' +
'<body>' +
'    <div class="container">' +
'        <h1>Estado del Despliegue</h1>' +
'        <div class="section">' +
'            <div class="item"><span class="label">Commit:</span>' + data.commit + '</div>' +
'            <div class="item"><span class="label">Rama:</span>' + data.branch + '</div>' +
'            <div class="item"><span class="label">Último mensaje:</span>' + data.lastMessage + '</div>' +
'            <div class="item"><span class="label">Fecha:</span>' + data.generatedAt + '</div>' +
'            <div class="item"><span class="label">Dominio:</span>' + data.domain + '</div>' +
'        </div>' +
'        <div class="section">' +
'            <h2>Estado del sistema</h2>' +
'            <div class="status ' + (data.integrityStatus === 'OK' ? 'ok' : 'error') + '">Integridad: ' + data.integrityStatus + '</div>' +
'            <div class="status ' + (data.metricsStatus === 'OK' ? 'ok' : 'error') + '">Métricas: ' + data.metricsStatus + '</div>' +
'        </div>' +
'        <p><a href="integrity.html">Ver reporte de integridad</a></p>' +
'        <p><a href="metrics.html">Ver métricas</a></p>' +
'        <p><a href="index.html">← Volver al inicio</a></p>' +
'    </div>' +
'</body>' +
'</html>';

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('✅ public/deploy-status.html generado.');
