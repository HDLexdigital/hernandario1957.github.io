'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..', '..', '..');
const PUBLIC_DIR = path.join(RAIZ, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'audit.html');

function readJSON(file) {
    const p = path.join(PUBLIC_DIR, file);
    if (!fs.existsSync(p)) return null;
    try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function card(title, state, total, errors, link) {
    const statusClass = state === 'OK' ? 'ok' : (state === 'SIN DATOS' ? 'missing' : 'error');
    return '<div class="card ' + statusClass + '"><div class="card-title">' + title + '</div><div class="card-status">' + state + '</div><div class="card-count">' + errors + ' / ' + total + ' errores</div>' + (link ? '<a href="' + link + '">Ver detalle</a>' : '') + '</div>';
}

function generarAudit() {
    const summary = readJSON('audit-summary.json');
    const status = summary && summary.status === 'OK' ? 'OK' : (summary ? 'ERROR' : 'SIN DATOS');
    const generatedAt = summary ? summary.generatedAt : '';

    let cardsHTML = '';
    if (summary) {
        cardsHTML = card('Integridad', summary.reports.integrity, summary.counts.integrityTotal, summary.counts.integrityErrors, 'integrity.html') +
                    card('Enlaces Externos', summary.reports.externalLinks, summary.counts.externalLinksTotal, summary.counts.externalLinksErrors, 'external-links.html') +
                    card('Anclas Internas', summary.reports.anchors, summary.counts.anchorsTotal, summary.counts.anchorsErrors, 'anchors.html');
    } else {
        cardsHTML = '<p>No hay resumen de auditoría disponible.</p>';
    }

    const html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Auditoría Consolidada</title></head><body><h1>Auditoría Consolidada</h1><div>Estado: ' + status + '</div><div>' + generatedAt + '</div><div class="cards">' + cardsHTML + '</div><p><a href="index.html">← Volver al inicio</a></p></body></html>';
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, html, 'utf8');
    console.log('✅ public/audit.html generado.');
    return OUTPUT_PATH;
}

module.exports = { generarAudit };
