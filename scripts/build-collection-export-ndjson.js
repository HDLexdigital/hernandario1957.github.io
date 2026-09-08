'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const DEFAULT_CATALOG = path.join(RAIZ, 'public', 'catalogo.json');
const DEFAULT_OUTPUT = path.join(RAIZ, 'public', 'collection-export.ndjson');

function toNDJSON(catalog) {
    const lineas = [];

    for (const doc of catalog) {
        const versions = doc.versions && doc.versions.length > 0 ? doc.versions : [''];

        for (const versionId of versions) {
            const entry = {
                documentId: doc.documentId,
                title: doc.title || doc.documentId,
                versionId,
                createdAt: doc.createdAt || '',
                url: doc.url || ('/' + doc.documentId + '/' + (versionId || '') + '/')
            };
            lineas.push(JSON.stringify(entry));
        }
    }

    return lineas.join('\n') + '\n';
}

function main() {
    const catalogPath = process.env.CATALOG_PATH || DEFAULT_CATALOG;
    const outputPath = process.env.OUTPUT_PATH || DEFAULT_OUTPUT;

    if (!fs.existsSync(catalogPath)) {
        console.error('❌ No se encontró catalogo.json en ' + catalogPath);
        process.exit(1);
    }

    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    const ndjson = toNDJSON(catalog);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, ndjson, 'utf8');

    console.log(`✅ collection-export.ndjson generado en ${outputPath}`);
}

if (require.main === module) {
    try {
        main();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

module.exports = { toNDJSON };
