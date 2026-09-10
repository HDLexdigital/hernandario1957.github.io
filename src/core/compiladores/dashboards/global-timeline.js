'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..', '..', '..');
const PUBLIC_DIR = path.join(RAIZ, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'global-timeline.html');

function generarGlobalTimelineHTML() {
    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Línea de Tiempo Global — LexDigitalHD</title>
</head>
<body>
    <h1>⏳ Línea de Tiempo Global del Corpus Jurídico</h1>
    <div id="timeline">Cargando eventos...</div>
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

    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, htmlContent, 'utf8');
    console.log('✅ public/global-timeline.html generado.');
    return OUTPUT_PATH;
}

module.exports = { generarGlobalTimelineHTML };
