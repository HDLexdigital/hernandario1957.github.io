'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..', '..');
const PUBLIC_DIR = path.join(RAIZ, 'public');

function leerJson(ruta) {
    if (!fs.existsSync(ruta)) return null;
    return JSON.parse(fs.readFileSync(ruta, 'utf8'));
}

function asegurarPublic() {
    if (!fs.existsSync(PUBLIC_DIR)) {
        fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    }
}

// ============================================================
// JSON — collection-export.json
// ============================================================
function compilarCollectionExport() {
    const catalogo = leerJson(path.join(PUBLIC_DIR, 'catalogo.json'));
    const timeline = leerJson(path.join(PUBLIC_DIR, 'global-timeline.json'));
    const metrics = leerJson(path.join(PUBLIC_DIR, 'build-metrics.json'));

    if (!catalogo || !timeline || !metrics) {
        throw new Error('No se encontraron catálogo, timeline o métricas.');
    }

    const payload = {
        exportedAt: new Date().toISOString(),
        catalog: catalogo,
        timeline,
        metrics
    };

    asegurarPublic();
    const outputPath = path.join(PUBLIC_DIR, 'collection-export.json');
    fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf8');
    console.log('✅ collection-export.json generado en ' + outputPath);
    return outputPath;
}

// ============================================================
// CSV — collection-export.csv
// ============================================================
function compilarCollectionCSV() {
    const catalogo = leerJson(path.join(PUBLIC_DIR, 'catalogo.json'));
    if (!catalogo) throw new Error('No se encontró catálogo.');

    const lineas = ['documentId,title,version,url'];
    for (const doc of catalogo) {
        const url = '/' + doc.id + '/';
        lineas.push([doc.documentId, doc.title, doc.version, url].map(v => '"' + String(v || '').replace(/"/g, '""') + '"').join(','));
    }

    asegurarPublic();
    const outputPath = path.join(PUBLIC_DIR, 'collection-export.csv');
    fs.writeFileSync(outputPath, lineas.join('\n'), 'utf8');
    console.log('✅ collection-export.csv generado en ' + outputPath);
    return outputPath;
}

// ============================================================
// NDJSON — collection-export.ndjson
// ============================================================
function compilarCollectionNDJSON() {
    const catalogo = leerJson(path.join(PUBLIC_DIR, 'catalogo.json'));
    if (!catalogo) throw new Error('No se encontró catálogo.');

    const lineas = catalogo.map(doc => JSON.stringify({
        documentId: doc.documentId,
        title: doc.title,
        version: doc.version,
        url: '/' + doc.id + '/'
    }));

    asegurarPublic();
    const outputPath = path.join(PUBLIC_DIR, 'collection-export.ndjson');
    fs.writeFileSync(outputPath, lineas.join('\n'), 'utf8');
    console.log('✅ collection-export.ndjson generado en ' + outputPath);
    return outputPath;
}

module.exports = {
    compilarCollectionExport,
    compilarCollectionCSV,
    compilarCollectionNDJSON
};
