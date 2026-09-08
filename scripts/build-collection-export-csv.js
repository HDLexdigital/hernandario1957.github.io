'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const DEFAULT_CATALOG = path.join(RAIZ, 'public', 'catalogo.json');
const DEFAULT_OUTPUT = path.join(RAIZ, 'public', 'collection-export.csv');
const DELIMITER = ',';

function escapar(valor) {
    const str = String(valor ?? '');
    if (/[",\n]/.test(str)) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

function toCSV(catalog) {
    const columns = ['documentId', 'title', 'versionId', 'createdAt', 'url'];
    const lineas = [columns.join(DELIMITER)];

    for (const doc of catalog) {
        const versions = doc.versions && doc.versions.length > 0 ? doc.versions : [''];
        for (const versionId of versions) {
            const fila = [
                doc.documentId,
                doc.title || doc.documentId,
                versionId,
                doc.createdAt || '',
                doc.url || ('/' + doc.documentId + '/' + (versionId || '') + '/')
            ].map(escapar);
            lineas.push(fila.join(DELIMITER));
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
    const csv = toCSV(catalog);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, csv, 'utf8');

    console.log(`✅ collection-export.csv generado en ${outputPath}`);
}

if (require.main === module) {
    try {
        main();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

module.exports = { toCSV };
