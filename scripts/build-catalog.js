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


function listarDocumentosDirectos() {
    return fs.readdirSync(PUBLICACIONES_DIR)
        .filter(nombre => {
            const full = path.join(PUBLICACIONES_DIR, nombre);
            return fs.statSync(full).isDirectory();
        })
        .map(nombre => {
            const dir = path.join(PUBLICACIONES_DIR, nombre);
            const archivos = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
            return { nombre, archivos };
        })
        .filter(item => item.archivos.length > 0);
}

function main() {
    const catalogo = [];
    const documentos = listarDocumentosDirectos();

    for (const doc of documentos) {
        const docDir = path.join(PUBLICACIONES_DIR, doc.nombre);
        const jsonFile = doc.archivos[0];
        const jsonPath = path.join(docDir, jsonFile);

        let metadata = {};
        try {
            const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            metadata = data.metadata || data.meta || { title: jsonFile };
        } catch {
            metadata = { title: jsonFile };
        }

        catalogo.push({
            id: doc.nombre,
            title: metadata.title || doc.nombre,
            version: metadata.version || '1.0.0',
            file: jsonFile
        });
    }

    fs.writeFileSync(CATALOGO_PATH, JSON.stringify(catalogo, null, 2));
    console.log('✅ catálogo generado con ' + catalogo.length + ' documento(s).');
}

try {
    main();
} catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
}
