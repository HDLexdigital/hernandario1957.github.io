'use strict';

const fs = require('fs');
const path = require('path');

const corePath = path.join(__dirname, '..', 'core');
const errores = [];

function resultado(mensaje, esError) {
    if (esError) {
        console.log(`[X] ${mensaje}`);
        errores.push(mensaje);
    } else {
        console.log(`[V] ${mensaje}`);
    }
}

function verificarEstructura() {
    console.log('\n=== NIVEL 1: ESTRUCTURA ===');
    const esperados = [
        'accessibility', 'adapters', 'cidm', 'compiler',
        'epub', 'integration', 'ledm', 'tools', 'web'
    ];
    for (const dir of esperados) {
        const ruta = path.join(corePath, dir);
        resultado(`Directorio base verificado: core/${dir}`, !fs.existsSync(ruta));
    }

    // Detección de anomalías
    const anomalias = [];
    const walk = (dir) => {
        if (!fs.existsSync(dir)) return;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (entry.name === 'Nueva carpeta' || (entry.name === 'tests' && full.includes('cidm'))) {
                    anomalias.push(full);
                }
                walk(full);
            }
        }
    };
    walk(corePath);
    anomalias.forEach(a => resultado(`Anomalía estructural: ${a}`, true));
}

function verificarJson() {
    console.log('\n=== NIVEL 2: SINTAXIS JSON ===');
    const jsonFiles = [];
    const walk = (dir) => {
        if (!fs.existsSync(dir)) return;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (entry.name.endsWith('.json')) jsonFiles.push(full);
        }
    };
    walk(corePath);

    for (const file of jsonFiles) {
        const rel = path.relative(corePath, file);
        try {
            JSON.parse(fs.readFileSync(file, 'utf8'));
            resultado(`JSON válido: ${rel}`, false);
        } catch {
            resultado(`JSON corrupto: ${rel}`, true);
        }
    }
}

function verificarApiWeb() {
    console.log('\n=== NIVEL 3: API WEB MVP-006 ===');
    const webRenderer = path.join(corePath, 'web', 'WebRenderer.js');
    if (!fs.existsSync(webRenderer)) {
        resultado('No se encontró WebRenderer.js', true);
        return;
    }
    const contenido = fs.readFileSync(webRenderer, 'utf8');
    const exportsRequeridos = [
        'renderHtml', 'renderBlock', 'renderContentNode',
        'generateNav', 'generateStaticIndex'
    ];
    for (const exp of exportsRequeridos) {
        resultado(`API WebRenderer exporta '${exp}'`, !(contenido.includes('module.exports') && contenido.includes(exp)));
    }
    resultado('Aislamiento WebRenderer verificado: sin app.activeDocument', contenido.includes('app.activeDocument'));
}

function main() {
    verificarEstructura();
    verificarJson();
    verificarApiWeb();

    console.log('\n=== RESULTADO FINAL ===');
    if (errores.length === 0) {
        console.log('ESTADO: PASSED. El core cumple estrictamente con la arquitectura.');
        process.exit(0);
    } else {
        console.log(`ESTADO: FAILED. Se encontraron ${errores.length} violaciones.`);
        process.exit(1);
    }
}

main();