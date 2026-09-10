'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..', '..', '..');
const OUTPUT_PATH = path.join(RAIZ, 'public', 'novedades.html');

function generarNovedades() {
    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Novedades Jurídicas — LexDigitalHD</title>
    <style>
        :root { --bg: #0f172a; --card: #1e293b; --text: #f8fafc; --muted: #94a3b8; --accent: #38bdf8; }
        body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 2rem; }
        .container { max-width: 900px; margin: 0 auto; }
        h1 { color: var(--accent); border-bottom: 2px solid #334155; padding-bottom: 0.5rem; }
        .grid { display: grid; gap: 1rem; margin-top: 1.5rem; }
        .card { background: var(--card); border-radius: 8px; padding: 1.25rem; border: 1px solid #334155; }
        .card h3 { margin: 0 0 0.5rem 0; color: #f1f5f9; }
        .meta { font-size: 0.85rem; color: var(--muted); margin-bottom: 0.75rem; }
        .badge { background: #0284c7; color: #fff; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📜 Novedades Jurídicas Recientes</h1>
        <p style="color: var(--muted);">Panel estático derivado del corpus oficial en LexDigitalHD 2.0</p>
        <div id="news-container" class="grid">
            <div class="card"><p style="color: var(--muted);">Cargando novedades precalculadas...</p></div>
        </div>
    </div>
    <script>
        async function loadNews() {
            const container = document.getElementById('news-container');
            try {
                const res = await fetch('./novedades.json');
                if (!res.ok) throw new Error('HTTP Error ' + res.status);
                const data = await res.json();
                const items = Array.isArray(data) ? data : (data.novedades || data.items || []);
                container.innerHTML = '';
                items.forEach(function(item) {
                    const card = document.createElement('div');
                    card.className = 'card';
                    const badge = document.createElement('span');
                    badge.className = 'badge';
                    badge.textContent = item.tipo || 'ACTUALIZACIÓN';
                    const h3 = document.createElement('h3');
                    h3.style.marginTop = '0.5rem';
                    h3.textContent = item.titulo || item.documento || 'Documento Jurídico';
                    const meta = document.createElement('div');
                    meta.className = 'meta';
                    meta.textContent = 'Fecha: ' + (item.fecha || item.createdAt || 'N/A') + ' | Versión: ' + (item.version || '1.0.0');
                    const desc = document.createElement('p');
                    desc.style.margin = '0';
                    desc.style.color = '#cbd5e1';
                    desc.textContent = item.descripcion || item.resumen || 'Actualización registrada en el corpus.';
                    card.appendChild(badge);
                    card.appendChild(h3);
                    card.appendChild(meta);
                    card.appendChild(desc);
                    container.appendChild(card);
                });
            } catch (err) {
                container.innerHTML = '<div class="card"><p style="color:#f87171;">Error al cargar novedades: ' + err.message + '</p></div>';
            }
        }
        loadNews();
    </script>
</body>
</html>`;

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, htmlContent, 'utf8');
    console.log('✅ public/novedades.html generado con éxito.');
    return OUTPUT_PATH;
}

module.exports = { generarNovedades };
