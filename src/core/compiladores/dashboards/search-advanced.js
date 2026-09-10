'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..', '..', '..');
const OUTPUT_PATH = path.join(RAIZ, 'public', 'search-advanced.html');

function generarSearchAdvanced() {
    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Búsqueda Avanzada — LexDigitalHD</title>
    <style>
        :root { --bg: #0f172a; --card: #1e293b; --text: #f8fafc; --muted: #94a3b8; --accent: #38bdf8; }
        body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 2rem; }
        .container { max-width: 900px; margin: 0 auto; }
        h1 { color: var(--accent); border-bottom: 2px solid #334155; padding-bottom: 0.5rem; }
        .filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1rem 0; }
        .filters input { padding: 0.6rem; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: #f8fafc; font-size: 0.95rem; }
        .results { display: grid; gap: 1rem; }
        .result { background: var(--card); border-radius: 6px; padding: 1rem; border: 1px solid #334155; }
        .result h3 { margin: 0 0 0.4rem; color: #f1f5f9; }
        .result p { margin: 0; color: #cbd5e1; }
        .empty { color: var(--muted); }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Búsqueda Avanzada</h1>
        <div class="filters">
            <input type="text" id="filter-doc" placeholder="Documento ID">
            <input type="text" id="filter-version" placeholder="Versión (v1, v2...)">
            <input type="text" id="filter-text" placeholder="Texto a buscar">
        </div>
        <div id="results" class="results"><p class="empty">Ajuste los filtros para buscar.</p></div>
    </div>
    <script>
        let searchIndex = [];
        async function init() {
            try {
                const res = await fetch('./search-index.json');
                if (!res.ok) throw new Error('HTTP ' + res.status);
                searchIndex = await res.json();
            } catch (err) {
                document.getElementById('results').innerHTML = '<p class="empty">Error al cargar índice.</p>';
            }
        }
        function render() {
            const doc = document.getElementById('filter-doc').value.trim().toLowerCase();
            const ver = document.getElementById('filter-version').value.trim().toLowerCase();
            const txt = document.getElementById('filter-text').value.trim().toLowerCase();
            const matches = searchIndex.filter(item => {
                const itemDoc = String(item.documentId || '').toLowerCase();
                const itemVer = String(item.versionId || '').toLowerCase();
                const itemText = String(item.text || '').toLowerCase();
                return (!doc || itemDoc.includes(doc)) &&
                       (!ver || itemVer.includes(ver)) &&
                       (!txt || itemText.includes(txt));
            }).slice(0, 30);
            const container = document.getElementById('results');
            if (matches.length === 0) {
                container.innerHTML = '<p class="empty">Sin resultados.</p>';
                return;
            }
            container.innerHTML = matches.map(item =>
                '<div class="result"><h3>' + (item.title || item.documentId) + ' <small>(' + (item.versionId || '') + ')</small></h3><p>' + (item.text || '') + '</p></div>'
            ).join('');
        }
        ['filter-doc', 'filter-version', 'filter-text'].forEach(id => {
            document.getElementById(id).addEventListener('input', render);
        });
        init();
    </script>
</body>
</html>`;

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, htmlContent, 'utf8');
    console.log('✅ public/search-advanced.html generado.');
    return OUTPUT_PATH;
}

module.exports = { generarSearchAdvanced };
