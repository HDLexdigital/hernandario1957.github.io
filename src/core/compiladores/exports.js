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

function escaparCSV(v) {
    const s = String(v == null ? '' : v);
    if (/[",\n]/.test(s)) {
        return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
}

function compilarCollectionExport() {
    const catalogo = leerJson(path.join(PUBLIC_DIR, 'catalogo.json'));
    const timeline = leerJson(path.join(PUBLIC_DIR, 'global-timeline.json'));
    const metrics = leerJson(path.join(PUBLIC_DIR, 'build-metrics.json'));

    if (!catalogo || !timeline || !metrics) {
        throw new Error('No se encontraron catálogo, timeline o métricas.');
    }

    const payload = buildExport(catalogo, timeline, metrics);

    asegurarPublic();
    const outputPath = path.join(PUBLIC_DIR, 'collection-export.json');
    fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf8');
    console.log('✅ collection-export.json generado en ' + outputPath);
    return outputPath;
}

function compilarCollectionCSV() {
    const catalogo = leerJson(path.join(PUBLIC_DIR, 'catalogo.json'));
    if (!catalogo) throw new Error('No se encontró catálogo.');

    asegurarPublic();
    const outputPath = path.join(PUBLIC_DIR, 'collection-export.csv');
    fs.writeFileSync(outputPath, toCSV(catalogo), 'utf8');
    console.log('✅ collection-export.csv generado en ' + outputPath);
    return outputPath;
}

function compilarCollectionNDJSON() {
    const catalogo = leerJson(path.join(PUBLIC_DIR, 'catalogo.json'));
    if (!catalogo) throw new Error('No se encontró catálogo.');

    asegurarPublic();
    const outputPath = path.join(PUBLIC_DIR, 'collection-export.ndjson');
    fs.writeFileSync(outputPath, toNDJSON(catalogo), 'utf8');
    console.log('✅ collection-export.ndjson generado en ' + outputPath);
    return outputPath;
}

function buildExport(catalog, timeline, metrics) {
    return {
        exportedAt: new Date().toISOString(),
        catalog,
        timeline,
        metrics
    };
}

function toCSV(catalogo) {
    const lineas = ['documentId,title,versionId,createdAt,url'];
    for (const doc of catalogo) {
        const versions = (doc.versions && doc.versions.length > 0) ? doc.versions : [''];
        for (const v of versions) {
            const url = '/' + doc.documentId + '/' + v + '/';
            const createdAt = doc.createdAt || '';
            lineas.push([doc.documentId, doc.title, v, createdAt, url].map(escaparCSV).join(','));
        }
    }
    return lineas.join('\n');
}

function toNDJSON(catalogo) {
    const lineas = [];
    for (const doc of catalogo) {
        const versions = (doc.versions && doc.versions.length > 0) ? doc.versions : [''];
        for (const v of versions) {
            lineas.push(JSON.stringify({
                documentId: doc.documentId,
                title: doc.title,
                versionId: v,
                url: '/' + doc.documentId + '/' + v + '/'
            }));
        }
    }
    return lineas.join('\n');
}

module.exports = {
    compilarCollectionExport,
    compilarCollectionCSV,
    compilarCollectionNDJSON,
    buildExport,
    toCSV,
    toNDJSON
};
