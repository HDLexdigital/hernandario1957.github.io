'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const DEFAULT_CATALOG = path.join(RAIZ, 'public', 'catalogo.json');
const DEFAULT_TIMELINE = path.join(RAIZ, 'public', 'global-timeline.json');
const DEFAULT_METRICS = path.join(RAIZ, 'public', 'build-metrics.json');
const DEFAULT_OUTPUT = path.join(RAIZ, 'public', 'collection-export.json');

function leerJson(ruta) {
    if (!fs.existsSync(ruta)) return null;
    return JSON.parse(fs.readFileSync(ruta, 'utf8'));
}

function buildExport(catalog, timeline, metrics) {
    return {
        exportedAt: new Date().toISOString(),
        catalog,
        timeline,
        metrics
    };
}

function main() {
    const catalog = leerJson(process.env.CATALOG_PATH || DEFAULT_CATALOG);
    const timeline = leerJson(process.env.TIMELINE_PATH || DEFAULT_TIMELINE);
    const metrics = leerJson(process.env.METRICS_PATH || DEFAULT_METRICS);
    const outputPath = process.env.OUTPUT_PATH || DEFAULT_OUTPUT;

    if (!catalog || !timeline || !metrics) {
        console.error('❌ No se encontraron catálogo, timeline o métricas.');
        process.exit(1);
    }

    const payload = buildExport(catalog, timeline, metrics);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf8');

    console.log(`✅ collection-export.json generado en ${outputPath}`);
}

if (require.main === module) {
    try {
        main();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

module.exports = { buildExport };
