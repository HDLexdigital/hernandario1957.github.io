'use strict';

const fs = require('fs');
const path = require('path');

const outputPath = path.join(process.cwd(), 'public', 'index.html');

const html = '<!DOCTYPE html>' +
'<html lang="es">' +
'<head>' +
'    <meta charset="UTF-8">' +
'    <meta name="viewport" content="width=device-width, initial-scale=1.0">' +
'    <title>LexDigitalHD 2.0 — Portal Jurídico Estático</title>' +
'    <style>' +
'        :root { --bg: #0f172a; --card: #1e293b; --text: #f8fafc; --muted: #94a3b8; --accent: #38bdf8; }' +
'        body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 2rem; }' +
'        .container { max-width: 900px; margin: 0 auto; }' +
'        h1 { color: var(--accent); border-bottom: 2px solid #334155; padding-bottom: 0.5rem; }' +
'        .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1.5rem 0; }' +
'        .card { background: var(--card); border: 1px solid #334155; border-radius: 8px; padding: 1rem; }' +
'        .card .label { color: var(--muted); font-size: 0.9rem; }' +
'        .card .value { font-size: 1.6rem; font-weight: 600; }' +
'        nav a { color: var(--accent); text-decoration: none; display: block; margin: 0.5rem 0; }' +
'        nav a:hover { text-decoration: underline; }' +
'        .section-title { margin-top: 2rem; }' +
'    </style>' +
'</head>' +
'<body>' +
'    <div class="container">' +
'        <h1>LexDigitalHD 2.0</h1>' +
'        <p style="color: var(--muted);">Portal público del corpus jurídico estático.</p>' +
'        <div class="cards" id="metrics-cards">' +
'            <div class="card"><div class="label">Cargando métricas...</div><div class="value">—</div></div>' +
'        </div>' +
'        <h2 class="section-title">Navegación</h2>' +
'        <nav id="main-nav">' +
'            <a href="search.html">Búsqueda Simplificada</a>' +
'            <a href="search-advanced.html">Búsqueda Avanzada</a>' +
'            <a href="search-relevance.html">Búsqueda con Relevancia</a>' +
'            <a href="novedades.html">Novedades</a>' +
'            <a href="global-timeline.html">Línea de Tiempo Global</a>' +
'            <a href="metrics.html">Métricas</a>' +
'            <a href="exports.html">Exportaciones</a>' +
'            <a href="collection.html">Colección Completa</a>' +
'        </nav>' +
'    </div>' +
'    <script>' +
'        fetch("./build-metrics.json")' +
'            .then(function(res) { return res.ok ? res.json() : null; })' +
'            .then(function(metrics) {' +
'                if (!metrics) return;' +
'                var el = document.getElementById("metrics-cards");' +
'                el.innerHTML = "";' +
'                var items = [' +
'                    ["Documentos", metrics.totalDocuments],' +
'                    ["Versiones", metrics.totalVersions],' +
'                    ["Core", metrics.coreVersion],' +
'                    ["LEDM", metrics.ledmVersion]' +
'                ];' +
'                items.forEach(function(entry) {' +
'                    var div = document.createElement("div");' +
'                    div.className = "card";' +
'                    var label = document.createElement("div");' +
'                    label.className = "label";' +
'                    label.textContent = entry[0];' +
'                    var value = document.createElement("div");' +
'                    value.className = "value";' +
'                    value.textContent = entry[1];' +
'                    div.appendChild(label);' +
'                    div.appendChild(value);' +
'                    el.appendChild(div);' +
'                });' +
'            })' +
'            .catch(function() {});' +
'    </script>' +
'</body>' +
'</html>';

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, html, 'utf8');
console.log('✅ public/index.html generado.');
