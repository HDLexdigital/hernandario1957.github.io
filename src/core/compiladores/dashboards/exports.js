'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..', '..', '..');
const OUTPUT_PATH = path.join(RAIZ, 'public', 'exports.html');

const exportsFiles = [
    'collection-export.json',
    'collection-export.csv',
    'collection-export.ndjson',
    'feed.xml',
    'sitemap.xml',
    'build-metrics.json'
];

function generarExports() {
    const itemsHtml = exportsFiles.map(name => {
        return '<div class="export-item"><div class="info"><h3>' + name + '</h3></div><a href="./' + name + '">Descargar</a></div>';
    }).join('');

    const htmlContent = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Exportaciones Públicas</title></head><body><h1>Exportaciones Públicas</h1><div>' + itemsHtml + '</div></body></html>';

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, htmlContent, 'utf8');
    console.log('✅ public/exports.html generado.');
    return OUTPUT_PATH;
}

module.exports = { generarExports };
