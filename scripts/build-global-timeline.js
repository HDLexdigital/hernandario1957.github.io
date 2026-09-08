'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const DEFAULT_TIMELINE_DIR = path.join(RAIZ, 'public', 'timeline');
const DEFAULT_OUTPUT_PATH = path.join(RAIZ, 'public', 'global-timeline.json');

function leerJson(ruta) {
    if (!fs.existsSync(ruta)) return null;
    return JSON.parse(fs.readFileSync(ruta, 'utf8'));
}

function construirGlobalTimeline(timelineDir) {
    const allEntries = [];

    const archivos = fs.existsSync(timelineDir)
        ? fs.readdirSync(timelineDir).filter(f => f.endsWith('.json'))
        : [];

    for (const archivo of archivos) {
        const timelinePath = path.join(timelineDir, archivo);
        const timeline = leerJson(timelinePath);

        if (Array.isArray(timeline)) {
            allEntries.push(...timeline);
        }
    }

    return allEntries.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function main() {
    const timelineDir = process.env.TIMELINE_DIR || DEFAULT_TIMELINE_DIR;
    const outputPath = process.env.GLOBAL_TIMELINE_PATH || DEFAULT_OUTPUT_PATH;

    const entries = construirGlobalTimeline(timelineDir);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(entries, null, 2), 'utf8');

    console.log(`✅ Línea de tiempo global generada con ${entries.length} eventos.`);
}

if (require.main === module) {
    try {
        main();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

module.exports = { construirGlobalTimeline };
