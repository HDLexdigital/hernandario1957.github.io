'use strict';

const fs = require('fs');
const path = require('path');

const outputPath = path.join(process.cwd(), 'public', 'collection.html');

const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Colección Completa — LexDigitalHD</title>
    <style>
        :root { --bg: #0f172a; --card: #1e293b; --text: #f8fafc; --muted: #94a3b8; --accent: #38bdf8; }
        body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 2rem; }
        .container { max-width: 900px; margin: 0 auto; }
        h1 { color: var(--accent); border-bottom: 2px solid #334155; padding-bottom: 0.5rem; }
        .document { background: var(--card); border: 1px solid #334155; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
        .document h2 { margin: 0 0 0.5rem; color: #f1f5f9; }
        .versions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .version { background: #334155; color: #cbd5e1; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.85rem; }
        .empty { color: var(--muted); }
    </style>
</head>
<body>
    <div class="container">
        <h1>📚 Colección Completa del Corpus</h1>
        <div id="collection" class="collection"><p class="empty">Cargando colección...</p></div>
    </div>
    <script>
        async function loadCollection() {
            const container = document.getElementById('collection');
            try {
                const res = await fetch('./collection-export.json');
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const data = await res.json();
                const documents = data.catalog || [];
                if (documents.length === 0) {
                    container.innerHTML = '<p class="empty">Sin documentos.</p>';
                    return;
                }
                container.innerHTML = documents.map(doc => {
                    const versions = doc.versions || [];
                    return '<div class="document"><h2>' + (doc.title || doc.documentId) + ' <small>(' + doc.documentId + ')</small></h2><div class="versions">' + versions.map(v => '<span class="version">' + v + '</span>').join('') + '</div></div>';
                }).join('');
            } catch (err) {
                container.innerHTML = '<p class="empty">Error al cargar colección: ' + err.message + '</p>';
            }
        }
        loadCollection();
    </script>
</body>
</html>`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, htmlContent, 'utf8');
console.log('✅ public/collection.html generado.');
