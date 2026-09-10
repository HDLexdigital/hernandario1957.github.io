'use strict';

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(process.cwd(), 'public');

function generarMetricas(metricas) {
    const outputPath = path.join(PUBLIC_DIR, 'build-metrics.json');
    fs.writeFileSync(outputPath, JSON.stringify(metricas, null, 2), 'utf8');
    return outputPath;
}

module.exports = { generarMetricas };
