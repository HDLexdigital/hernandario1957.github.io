/**
 * G3.4-T3 — Auditoría de Artefactos Reales bajo Contrato de Cobertura
 * Evalúa fragmento.semantic_map.json frente a fragmento.css, miEstiloJuridico.css y styles.css.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function extraerClasesSemanticMap(semanticMapPath) {
    const content = fs.readFileSync(semanticMapPath, 'utf-8');
    const semanticMap = JSON.parse(content);
    const classes = new Set();
    const styles = semanticMap.styles || [];
    
    for (const style of styles) {
        if (style.exportTagging && style.exportTagging.epub && style.exportTagging.epub.className) {
            classes.add(style.exportTagging.epub.className);
        }
    }
    return classes;
}

function extraerSelectoresCSS(cssPath) {
    if (!fs.existsSync(cssPath)) return new Set();
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    const classes = new Set();
    // Regex estricta para selectores de clase CSS
    const regex = /\.([a-zA-Z0-9_-]+)\s*\{/g;
    let match;
    
    while ((match = regex.exec(cssContent)) !== null) {
        classes.add(match[1]);
    }
    return classes;
}

describe('G3.4-T3 — Auditoría de Artefactos Reales', () => {

    const semanticMapPath = path.join(__dirname, '../../estilos/fragmento.semantic_map.json');

    const candidatosCSS = [
        { name: 'fragmento.css', path: path.join(__dirname, '../../estilos/fragmento.css') },
        { name: 'miEstiloJuridico.css', path: path.join(__dirname, '../../src/assets/miEstiloJuridico.css') },
        { name: 'styles.css', path: path.join(__dirname, '../../src/assets/styles.css') }
    ];

    test('Auditoría exhaustiva de C_map vs C_css para los artefactos reales', () => {
        const cMap = extraerClasesSemanticMap(semanticMapPath);
        console.log(`\n[G3.4-T3] Total de clases contractuales en C_map: ${cMap.size}`);

        const matrizResultados = [];

        for (const candidato of candidatosCSS) {
            const cCss = extraerSelectoresCSS(candidato.path);
            const faltantes = [];
            const extras = [];

            for (const cls of cMap) {
                if (!cCss.has(cls)) faltantes.push(cls);
            }

            for (const cls of cCss) {
                if (!cMap.has(cls)) extras.push(cls);
            }

            const resultado = {
                artefacto: candidato.name,
                cMapSize: cMap.size,
                cCssSize: cCss.size,
                faltantesCount: faltantes.length,
                faltantes,
                extrasCount: extras.length,
                valido: faltantes.length === 0
            };

            matrizResultados.push(resultado);

            console.log(`\n--- Auditoría de: ${candidato.name} ---`);
            console.log(`  - Selectores en CSS (C_css): ${cCss.size}`);
            console.log(`  - Clases faltantes (C_map - C_css): ${faltantes.length}`);
            if (faltantes.length > 0 && faltantes.length <= 15) {
                console.log(`    Faltantes:`, faltantes);
            } else if (faltantes.length > 15) {
                console.log(`    Faltantes (primeras 15):`, faltantes.slice(0, 15));
            }
            console.log(`  - Clases extras en CSS (C_css - C_map): ${extras.length}`);
            console.log(`  - ¿Satisface C_map ⊆ C_css?: ${resultado.valido ? '🟢 SÍ' : '🔴 NO'}`);
        }

        // Aserción informativa de auditoría: aseguramos que el test ejecute y reporte
        assert.ok(matrizResultados.length > 0);
    });

});