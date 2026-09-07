'use strict';

const fs = require('fs');
const path = require('path');

const outputPath = path.join(process.cwd(), 'public', 'search.html');

const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Búsqueda Jurídica — LexDigitalHD</title>
    <style>
        :root { --bg: #0f172a; --card: #1e293b; --text: #f8fafc; --muted: #94a3b8; --accent: #38bdf8; }
        body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 2rem; }
        .container { max-width: 900px; margin: 0 auto; }
        h1 { color: var(--accent); border-bottom: 2px solid #334155; padding-bottom: 0.5rem; }
        input[type="search"] { width: 100%; padding: 0.8rem; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: #f8fafc; font-size: 1rem; margin: 1rem 0; }
        .results { display: grid; gap: 1rem; }
        .result { background: var(--card); border-radius: 6px; padding: 1rem; border: 1px solid #334155; }
        .result h3 { margin: 0 0 0.4rem; color: #f1f5f9; }
        .result p { margin: 0; color: #cbd5e1; }
        .empty { color: var(--muted); }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Búsqueda Jurídica</h1>
        <input type="search" id="search-input" placeholder="Buscar normas, artículos, títulos..." autocomplete="off">
        <div id="results" class="results"><p class="empty">Escriba al menos 2 caracteres para comenzar.</p></div>
    </div>
    <script>
        let searchIndex = [];
        async function init() {
            try {
                const res = await fetch('./search-index.json');
                if (!res.ok) throw new Error('HTTP ' + res.status);
                searchIndex = await res.json();
            } catch (err) {
                document.getElementById('results').innerHTML = '<p class="empty">Error al cargar índice de búsqueda.</p>';
            }
        }
        function render(query) {
            const container = document.getElementById('results');
            const q = query.trim().toLowerCase();
            if (q.length < 2) {
                container.innerHTML = '<p class="empty">Escriba al menos 2 caracteres.</p>';
                return;
            }
            const matches = searchIndex.filter(item => (item.text || '').includes(q)).slice(0, 20);
            if (matches.length === 0) {
                container.innerHTML = '<p class="empty">Sin resultados.</p>';
                return;
            }
            container.innerHTML = matches.map(item =>
                '<div class="result"><h3>' + (item.title || item.documentId) + '</h3><p>' + (item.text || '') + '</p></div>'
            ).join('');
        }
        document.getElementById('search-input').addEventListener('input', event => render(event.target.value));
        init();
    </script>
</body>
</html>`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, htmlContent, 'utf8');
console.log('✅ public/search.html generado.');
