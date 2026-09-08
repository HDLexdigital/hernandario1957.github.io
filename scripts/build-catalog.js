'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const PUBLICACIONES_DIR = path.join(RAIZ, 'publicaciones');
const CATALOGO_PATH = path.join(RAIZ, 'public', 'catalogo.json');

function esDirectorio(ruta) {
    return fs.statSync(ruta).isDirectory();
}

function listarDocumentos() {
    return fs.readdirSync(PUBLICACIONES_DIR)
        .filter(nombre => esDirectorio(path.join(PUBLICACIONES_DIR, nombre)));
}

function listarVersiones(documentoDir) {
    return fs.readdirSync(documentoDir)
        .filter(nombre => esDirectorio(path.join(documentoDir, nombre)))
        .sort();
}

function leerLedm(ledmPath) {
    return JSON.parse(fs.readFileSync(ledmPath, 'utf8'));
}

function main() {
    const catalogo = [];

    for (const documento of listarDocumentos()) {
        const documentoDir = path.join(PUBLICACIONES_DIR, documento);
        const versiones = listarVersiones(documentoDir);

        if (versiones.length === 0) continue;

        const versionesValidas = versiones.filter(v => {
            const ledmPath = path.join(documentoDir, v, 'documento.ledm.json');
            return fs.existsSync(ledmPath);
        });

        if (versionesValidas.length === 0) continue;

        const primerLedm = leerLedm(path.join(documentoDir, versionesValidas[0], 'documento.ledm.json'));
        const documentId = primerLedm.meta.documentId || documento;

        catalogo.push({
            documentId,
            versions: versionesValidas
        });
    }

    fs.mkdirSync(path.dirname(CATALOGO_PATH), { recursive: true });
    fs.writeFileSync(CATALOGO_PATH, JSON.stringify(catalogo, null, 2), 'utf8');

    console.log(`✅ catálogo generado con ${catalogo.length} documento(s).`);
}

try {
    main();
} catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
}
