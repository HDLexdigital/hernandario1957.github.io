'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..', '..', '..');
const PUBLIC_DIR = path.join(RAIZ, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'anchors.html');

function readJSON(file) {
    const p = path.join(PUBLIC_DIR, file);
    if (!fs.existsSync(p)) return null;
    try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function generarAnchors() {
    const anchors = readJSON('anchors.json');
    const items = Array.isArray(anchors) ? anchors : (anchors && anchors.items) || [];
    const status = items.length > 0 ? 'OK' : 'SIN DATOS';

    let itemsHTML = '';
    if (items.length > 0) {
        itemsHTML = items.map(a => '<li>' + (a.documentId || '') + ' #' + (a.id || '') + ' — ' + (a.text || '') + '</li>').join('');
    } else {
        itemsHTML = '<li>No hay anclas registradas.</li>';
    }

    const html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Anclas Internas</title></head><body><h1>Anclas Internas</h1><div>Estado: ' + status + '</div><div>Total: ' + items.length + '</div><ul>' + itemsHTML + '</ul></body></html>';
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, html, 'utf8');
    console.log('✅ public/anchors.html generado.');
    return OUTPUT_PATH;
}

module.exports = { generarAnchors };
