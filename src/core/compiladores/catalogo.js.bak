'use strict';

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(process.cwd(), 'public');

function generarCatalogo(catalogo) {
    const outputPath = path.join(PUBLIC_DIR, 'catalogo.json');
    fs.writeFileSync(outputPath, JSON.stringify(catalogo, null, 2), 'utf8');
    return outputPath;
}

module.exports = { generarCatalogo };
