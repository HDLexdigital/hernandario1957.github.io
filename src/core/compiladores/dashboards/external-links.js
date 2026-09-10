'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..', '..', '..');
const PUBLIC_DIR = path.join(RAIZ, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'external-links.html');

function readJSON(file) {
    const p = path.join(PUBLIC_DIR, file);
    if (!fs.existsSync(p)) return null;
    try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function generarExternalLinks() {
    const report = readJSON('external-links-report.json');
    const status = report && report.status === 'OK' ? 'OK' : (report ? 'ERROR' : 'SIN DATOS');
    const generatedAt = report ? report.generatedAt : '';
    let itemsHTML = '';
    if (report && report.items && report.items.length > 0) {
        itemsHTML = report.items.map(item => '<li>' + item.url + ' — ' + item.status + '</li>').join('');
    } else {
        itemsHTML = '<li>No hay enlaces externos registrados.</li>';
    }
    const html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Enlaces Externos</title></head><body><h1>Enlaces Externos</h1><div>Estado: ' + status + '</div><div>' + generatedAt + '</div><ul>' + itemsHTML + '</ul></body></html>';
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, html, 'utf8');
    console.log('✅ public/external-links.html generado.');
    return OUTPUT_PATH;
}

module.exports = { generarExternalLinks };
