'use strict';

const fs = require('fs');
const path = require('path');

function leerJSON(ruta) {
    if (!fs.existsSync(ruta)) return null;
    return JSON.parse(fs.readFileSync(ruta, 'utf8'));
}

function escribirJSON(ruta, data) {
    fs.mkdirSync(path.dirname(ruta), { recursive: true });
    fs.writeFileSync(ruta, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = { leerJSON, escribirJSON };
