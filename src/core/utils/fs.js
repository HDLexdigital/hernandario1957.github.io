'use strict';

const fs = require('fs');
const path = require('path');

function limpiarBOM(texto) {
    if (typeof texto !== 'string') return texto;
    return texto.replace(/^\uFEFF/, '');
}

function leerJSON(ruta) {
    if (!fs.existsSync(ruta)) return null;
    const crudo = fs.readFileSync(ruta, 'utf8');
    return JSON.parse(limpiarBOM(crudo));
}

function leerJSONSinBOM(ruta) {
    return leerJSON(ruta);
}

function escribirJSON(ruta, data) {
    fs.mkdirSync(path.dirname(ruta), { recursive: true });
    fs.writeFileSync(ruta, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = { limpiarBOM, leerJSON, leerJSONSinBOM, escribirJSON };
