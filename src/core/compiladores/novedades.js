'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..', '..');
const CATALOGO_PATH = process.env.CATALOGO_PATH || path.join(RAIZ, 'public', 'catalogo.json');
const NOVEDADES_PATH = process.env.NOVEDADES_PATH || path.join(RAIZ, 'public', 'novedades.json');

function leerJson(ruta) {
    if (!fs.existsSync(ruta)) return null;
    return JSON.parse(fs.readFileSync(ruta, 'utf8'));
}

function extraerNovedades(catalogo, manifestDir) {
    const items = [];

    for (const doc of catalogo) {
        const manifestPath = path.join(manifestDir, doc.documentId, 'manifest.json');
        const manifest = leerJson(manifestPath);

        (doc.versions || []).forEach(versionId => {
            const versionManifestPath = path.join(manifestDir, doc.documentId, versionId, 'manifest.json');
            const versionManifest = leerJson(versionManifestPath);

            const createdAt = (versionManifest && versionManifest.createdAt) ||
                              (manifest && manifest.createdAt) || null;

            items.push({
                documentId: doc.documentId,
                title: (versionManifest && versionManifest.title) ||
                       (manifest && manifest.title) ||
                       doc.documentId,
                versionId,
                createdAt,
                url: '/' + doc.documentId + '/' + versionId + '/'
            });
        });
    }

    return items
        .filter(item => item.createdAt)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 20);
}

function compilarNovedades() {
    const catalogo = leerJson(CATALOGO_PATH);
    if (!catalogo) {
        throw new Error('No se encontró el catálogo en ' + CATALOGO_PATH);
    }

    const manifestDir = path.dirname(CATALOGO_PATH);
    const novedades = extraerNovedades(catalogo, manifestDir);

    fs.mkdirSync(path.dirname(NOVEDADES_PATH), { recursive: true });
    fs.writeFileSync(NOVEDADES_PATH, JSON.stringify(novedades, null, 2), 'utf8');

    console.log('✅ Novedades generadas: ' + novedades.length + ' registros');
    return novedades;
}

module.exports = { compilarNovedades, extraerNovedades };
