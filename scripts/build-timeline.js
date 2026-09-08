'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const DEFAULT_CATALOGO_PATH = path.join(RAIZ, 'public', 'catalogo.json');
const DEFAULT_TIMELINE_DIR = path.join(RAIZ, 'public', 'timeline');

function leerJson(ruta) {
    if (!fs.existsSync(ruta)) return null;
    return JSON.parse(fs.readFileSync(ruta, 'utf8'));
}

function extraerTimeline(catalogo, publicDir) {
    const timeline = {};

    for (const doc of catalogo) {
        const entries = [];
        const docManifestPath = path.join(publicDir, doc.documentId, 'manifest.json');
        const docManifest = leerJson(docManifestPath);

        (doc.versions || []).forEach(versionId => {
            const versionManifestPath = path.join(publicDir, doc.documentId, versionId, 'manifest.json');
            const versionManifest = leerJson(versionManifestPath);

            const createdAt = versionManifest?.createdAt || docManifest?.createdAt || null;

            entries.push({
                documentId: doc.documentId,
                versionId,
                createdAt,
                title: versionManifest?.title || docManifest?.title || doc.documentId,
                url: '/' + doc.documentId + '/' + versionId + '/'
            });
        });

        entries.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        timeline[doc.documentId] = entries;
    }

    return timeline;
}

function main() {
    const catalogoPath = process.env.CATALOGO_PATH || DEFAULT_CATALOGO_PATH;
    const timelineDir = process.env.TIMELINE_DIR || DEFAULT_TIMELINE_DIR;

    const catalogo = leerJson(catalogoPath);
    if (!catalogo) {
        console.error('❌ No se encontró el catálogo en ' + catalogoPath);
        process.exit(1);
    }

    const publicDir = path.dirname(catalogoPath);
    const timeline = extraerTimeline(catalogo, publicDir);

    fs.mkdirSync(timelineDir, { recursive: true });

    for (const [documentId, entries] of Object.entries(timeline)) {
        const outputPath = path.join(timelineDir, documentId + '.json');
        fs.writeFileSync(outputPath, JSON.stringify(entries, null, 2), 'utf8');
    }

    console.log(`✅ Línea de tiempo generada para ${Object.keys(timeline).length} documento(s).`);
}

if (require.main === module) {
    try {
        main();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

module.exports = { extraerTimeline };
