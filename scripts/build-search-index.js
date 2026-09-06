'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const INDICE_PATH = path.join(RAIZ, 'public', 'indice.json');
const MANIFEST_PATH = path.join(RAIZ, 'public', 'manifest.json');
const OUTPUT_PATH = path.join(RAIZ, 'public', 'search-index.json');

function normalizar(texto) {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function main() {
    if (!fs.existsSync(INDICE_PATH) || !fs.existsSync(MANIFEST_PATH)) {
        console.error('❌ No se encontraron indice.json o manifest.json en public/');
        process.exit(1);
    }

    const indice = JSON.parse(fs.readFileSync(INDICE_PATH, 'utf8'));
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

    const searchItems = indice.map(entry => ({
        documentId: entry.documentId || manifest.documentId || 'UNKNOWN',
        title: entry.title || '',
        nodeId: entry.nodeId || '',
        text: normalizar(entry.title || ''),
        url: entry.url || ''
    }));

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(searchItems, null, 2), 'utf8');

    console.log(`✅ search-index.json generado con ${searchItems.length} entradas.`);
}

try {
    main();
} catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
}
