'use strict';

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(process.cwd(), 'public');

function generarDashboard(nombre, html) {
    const outputPath = path.join(PUBLIC_DIR, nombre);
    fs.writeFileSync(outputPath, html, 'utf8');
    return outputPath;
}

module.exports = { generarDashboard };
