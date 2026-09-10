'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..', '..', '..');
const OUTPUT_PATH = path.join(RAIZ, 'public', 'search-relevance.html');

function generarSearchRelevance() {
    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Búsqueda con Relevancia — LexDigitalHD</title>
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
        .score { display: inline-block; background: #0284c7; color: #fff; border-radius: 12px; padding: 0.1rem 0.5rem; font-size: 0.75rem; margin-left: 0.5rem; }
        .empty { color: var(--muted); }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Búsqueda con Relevancia</h1>
        <input type="search" id="search-input" placeholder="Buscar en el corpus..." autocomplete="off">
        <div id="results" class="results"><p class="empty">Escriba al menos 2 caracteres.</p></div>
    </div>
    <script>
        let searchIndex = [];
        function normalizar(texto) {
            return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        }
        function frecuencia(texto, termino) {
            const q = normalizar(String(texto || ''));
            const t = normalizar(termino);
            if (!t) return 0;
            let count = 0;
            let pos = 0;
            while ((pos = q.indexOf(t, pos)) !== -1) {
                count++;
                pos += t.length;
            }
            return count;
        }
        async function init() {
            try {
                const res = await fetch('./search-index.json');
                if (!res.ok) throw new Error('HTTP ' + res.status);
                searchIndex = await res.json();
            } catch (err) {
                document.getElementById('results').innerHTML = '<p class="empty">Error al cargar índice.</p>';
            }
        }
        function render(query) {
            const container = document.getElementById('results');
            const q = query.trim();
            if (q.length < 2) {
                container.innerHTML = '<p class="empty">Escriba al menos 2 caracteres.</p>';
                return;
            }
            const resultados = searchIndex.map(item => ({
                item,
                score: frecuencia(item.text, q) + frecuencia(item.title, q) * 2
            })).filter(entry => entry.score > 0).sort((a, b) => b.score - a.score).slice(0, 20);
            if (resultados.length === 0) {
                container.innerHTML = '<p class="empty">Sin resultados.</p>';
                return;
            }
            container.innerHTML = resultados.map(({item, score}) =>
                '<div class="result"><h3>' + (item.title || item.documentId) + '<span class="score">score ' + score + '</span></h3><p>' + (item.text || '') + '</p></div>'
            ).join('');
        }
        document.getElementById('search-input').addEventListener('input', event => render(event.target.value));
        init();
    </script>
</body>
</html>`;

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, htmlContent, 'utf8');
    console.log('✅ public/search-relevance.html generado.');
    return OUTPUT_PATH;
}

module.exports = { generarSearchRelevance };
