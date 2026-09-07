'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RAIZ = path.join(__dirname, '..');
const DEFAULT_CATALOGO_PATH = path.join(RAIZ, 'public', 'catalogo.json');
const DEFAULT_METRICS_PATH = path.join(RAIZ, 'public', 'build-metrics.json');

function leerJson(ruta) {
    if (!fs.existsSync(ruta)) return null;
    return JSON.parse(fs.readFileSync(ruta, 'utf8'));
}

function sha256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

function calcularMetricas(catalogo) {
    const totalDocuments = catalogo.length;
    const totalVersions = catalogo.reduce((sum, doc) => sum + (doc.versions || []).length, 0);

    const metrics = {
        generatedAt: new Date().toISOString(),
        totalDocuments,
        totalVersions,
        coreVersion: '1.0.0',
        ledmVersion: '2.0',
        checksum: sha256(JSON.stringify(catalogo))
    };

    return metrics;
}

function main() {
    const catalogoPath = process.env.CATALOGO_PATH || DEFAULT_CATALOGO_PATH;
    const metricsPath = process.env.METRICS_PATH || DEFAULT_METRICS_PATH;

    const catalogo = leerJson(catalogoPath);
    if (!catalogo) {
        console.error('❌ No se encontró el catálogo en ' + catalogoPath);
        process.exit(1);
    }

    const metrics = calcularMetricas(catalogo);

    fs.mkdirSync(path.dirname(metricsPath), { recursive: true });
    fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2), 'utf8');

    console.log(`✅ Métricas generadas en ${metricsPath}`);
}

if (require.main === module) {
    try {
        main();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

module.exports = { calcularMetricas };
