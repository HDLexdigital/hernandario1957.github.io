'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..', '..');
const PUBLICACIONES_DIR = path.join(RAIZ, 'publicaciones');
const CATALOGO_PATH = path.join(RAIZ, 'public', 'catalogo.json');

function esDirectorio(ruta) {
    try {
        return fs.statSync(ruta).isDirectory();
    } catch {
        return false;
    }
}

function listarDocumentos() {
    return fs.readdirSync(PUBLICACIONES_DIR)
        .filter(nombre => esDirectorio(path.join(PUBLICACIONES_DIR, nombre)));
}

function esVersionValida(ruta) {
    return /^v\d+$/i.test(path.basename(ruta));
}

function listarVersiones(documentoDir) {
    return fs.readdirSync(documentoDir)
        .filter(nombre => {
            const full = path.join(documentoDir, nombre);
            return esDirectorio(full) && esVersionValida(full);
        })
        .sort();
}

function buscarJsonEnVersion(versionDir) {
    const archivos = fs.readdirSync(versionDir).filter(f => f.endsWith('.json'));
    return archivos[0] || null;
}

function buscarJsonEnRaiz(documentoDir) {
    const archivos = fs.readdirSync(documentoDir).filter(f => f.endsWith('.json'));
    return archivos[0] || null;
}

function construirCatalogo() {
    const catalogo = [];
    const documentos = listarDocumentos();

    for (const nombre of documentos) {
        const docDir = path.join(PUBLICACIONES_DIR, nombre);
        const versiones = listarVersiones(docDir);

        if (versiones.length > 0) {
            const versionDir = path.join(docDir, versiones[0]);
            const jsonFile = buscarJsonEnVersion(versionDir);

            catalogo.push({
                documentId: nombre.toUpperCase(),
                id: nombre,
                title: nombre,
                versions: versiones,
                version: versiones[0],
                file: jsonFile ? path.join(versiones[0], jsonFile) : null
            });
        } else {
            const jsonFile = buscarJsonEnRaiz(docDir);
            if (!jsonFile) continue;

            let metadata = {};
            try {
                metadata = JSON.parse(fs.readFileSync(path.join(docDir, jsonFile), 'utf8'));
            } catch {
                metadata = {};
            }

            catalogo.push({
                documentId: nombre.toUpperCase(),
                id: nombre,
                title: metadata.title || nombre,
                versions: ['v1'],
                version: '1.0.0',
                file: jsonFile
            });
        }
    }

    return catalogo;
}

function generarCatalogo(catalogo) {
    fs.mkdirSync(path.dirname(CATALOGO_PATH), { recursive: true });
    fs.writeFileSync(CATALOGO_PATH, JSON.stringify(catalogo, null, 2), 'utf8');
    return CATALOGO_PATH;
}

function compilarCatalogo() {
    const catalogo = construirCatalogo();
    generarCatalogo(catalogo);
    console.log('✅ catálogo generado con ' + catalogo.length + ' documento(s).');
    return catalogo;
}

module.exports = { compilarCatalogo, construirCatalogo, generarCatalogo };
