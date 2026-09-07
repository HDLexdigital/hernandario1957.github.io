'use strict';

const fs = require('fs');
const path = require('path');

const outputPath = path.join(process.cwd(), 'public', 'global-timeline.html');

const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Línea de Tiempo Global — LexDigitalHD</title>
    <style>
        :root { --bg: #0f172a; --card: #1e293b; --text: #f8fafc; --muted: #94a3b8; --accent: #38bdf8; }
        body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 2rem; }
        .container { max-width: 900px; margin: 0 auto; }
        h1 { color: var(--accent); border-bottom: 2px solid #334155; padding-bottom: 0.5rem; }
        .timeline { display: grid; gap: 1rem; margin-top: 1.5rem; }
        .event { background: var(--card); border-left: 3px solid var(--accent); padding: 0.8rem 1rem; border-radius: 6px; }
        .event .date { color: var(--muted); font-size: 0.85rem; }
        .event .title { font-weight: 600; margin-top: 0.2rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>⏳ Línea de Tiempo Global del Corpus Jurídico</h1>
        <div id="timeline" class="timeline">Cargando eventos...</div>
    </div>
    <script>
        async function loadTimeline() {
            const container = document.getElementById('timeline');
            try {
                const res = await fetch('./global-timeline.json');
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const events = await res.json();
                if (!Array.isArray(events) || events.length === 0) {
                    container.textContent = 'Sin eventos.';
                    return;
                }
                container.innerHTML = events.map(ev => {
                    const date = ev.createdAt ? new Date(ev.createdAt).toLocaleString() : 'Fecha no disponible';
                    return '<div class="event"><div class="date">' + date + '</div><div class="title">' + (ev.title || ev.documentId) + ' <small>(' + (ev.versionId || '') + ')</small></div></div>';
                }).join('');
            } catch (err) {
                container.textContent = 'Error: ' + err.message;
            }
        }
        loadTimeline();
    </script>
</body>
</html>`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, htmlContent, 'utf8');
console.log('✅ public/global-timeline.html generado.');
