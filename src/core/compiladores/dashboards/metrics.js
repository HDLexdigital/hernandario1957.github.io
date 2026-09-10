'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..', '..', '..');
const PUBLIC_DIR = path.join(RAIZ, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'metrics.html');

function generarMetrics() {
    const html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Métricas — LexDigitalHD</title></head><body><h1>Métricas de Compilación</h1><p>Fuente: <code>build-metrics.json</code> y <code>global-timeline.json</code></p><div id="metrics"></div><p><a href="index.html">← Volver al inicio</a></p><script>fetch("./build-metrics.json").then(function(res){return res.ok?res.json():null;}).then(function(metrics){if(!metrics)return;var el=document.getElementById("metrics");el.innerHTML="<p>Documentos: "+(metrics.totalDocuments||"N/D")+"</p><p>Versiones: "+(metrics.totalVersions||"N/D")+"</p><p>Core: "+(metrics.coreVersion||"N/D")+"</p><p>LEDM: "+(metrics.ledmVersion||"N/D")+"</p>";}).catch(function(){});fetch("./global-timeline.json").then(function(res){return res.ok?res.json():null;}).catch(function(){});</script></body></html>';

    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, html, 'utf8');
    console.log('✅ public/metrics.html generado.');
    return OUTPUT_PATH;
}

module.exports = { generarMetrics };
