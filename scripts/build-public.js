'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const PUBLIC = path.join(RAIZ, 'public');

function ejecutar(comando, descripcion) {
    console.log('\n▶ ' + descripcion + '...');
    try {
        execSync(comando, { cwd: RAIZ, stdio: 'inherit' });
        console.log('✅ ' + descripcion + ' completado.');
        return true;
    } catch (error) {
        console.log('⚠️ ' + descripcion + ' falló.');
        return false;
    }
}

function archivoExiste(nombre) {
    return fs.existsSync(path.join(PUBLIC, nombre));
}

function main() {
    if (!fs.existsSync(PUBLIC)) fs.mkdirSync(PUBLIC, { recursive: true });

    ejecutar('node scripts/build-catalog.js', 'Generando catálogo');
    ejecutar('node scripts/build-metrics.js', 'Generando métricas');
    ejecutar('node scripts/build-timeline.js', 'Generando timeline');
    ejecutar('node scripts/build-global-timeline.js', 'Generando timeline global');
    ejecutar('node scripts/build-collection-export.js', 'Generando collection-export');

    // Verificar artefactos base
    ['catalogo.json', 'build-metrics.json', 'collection-export.json'].forEach(archivo => {
        if (!archivoExiste(archivo)) {
            console.error('❌ Falta artefacto base: ' + archivo);
            process.exit(1);
        }
    });

    ejecutar('node scripts/build-integrity-report.js', 'Generando reporte de integridad');
    ejecutar('node scripts/build-external-links-report.js', 'Generando reporte de enlaces externos');
    ejecutar('node scripts/build-audit-summary.js', 'Generando resumen de auditoría');

    // Dashboards
    [
        'build-public-home.js',
        'build-public-nav.js',
        'build-public-search.js',
        'build-public-search-advanced.js',
        'build-public-search-relevance.js',
        'build-public-novedades.js',
        'build-global-timeline-html.js',
        'build-public-exports.js',
        'build-public-collection.js',
        'build-public-integrity.js',
        'build-deploy-status.js',
        'build-public-external-links.js',
        'build-public-anchors.js',
        'build-public-audit.js',
        'build-public-metrics.js'
    ].forEach(script => {
        ejecutar('node scripts/' + script, 'Generando ' + script.replace('.js', ''));
    });

    ejecutar('node scripts/build-integrity-report.js', 'Validando integridad final');

    const reporte = path.join(PUBLIC, 'integrity-report.json');
    if (fs.existsSync(reporte)) {
        const data = JSON.parse(fs.readFileSync(reporte, 'utf8'));
        console.log('\n📊 Estado final de integridad: ' + data.status);
        if (data.status !== 'OK') process.exit(1);
    }

    console.log('\n✅ Build público completado correctamente.');
}

main();
