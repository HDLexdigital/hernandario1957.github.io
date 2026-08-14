'use strict';

const fs = require('fs');
const path = require('path');

function auditarMetricasCSS() {
    console.log('============================================================');
    console.log('    E12.3-BASE — INVENTARIO EMPÍRICO DE PROPIEDADES CSS');
    console.log('============================================================');

    // Localizamos el archivo CSS fuente del proyecto (ajusta la ruta si es necesario según tu estructura)
    const cssPath = path.join(__dirname, '../estilos/fragmento.css'); 
    
    if (!fs.existsSync(cssPath)) {
        console.error(`[ERROR] No se encuentra el archivo CSS en: ${cssPath}`);
        return;
    }

    const cssText = fs.readFileSync(cssPath, 'utf8');
    console.log(`[E12.3-BASE] Archivo CSS cargado correctamente (${cssText.length} caracteres).\n`);

    // Clases o selectores que queremos auditar en base a la evidencia anterior y semántica
    const selectorsToInspect = [
        'cuerpo-siguiente',
        'sangria-n1',
        'base-titulos',
        'p02-title-main',
        'titulo',
        'texto-centrado-normal',
        'texto-centrado-bold',
        'texto_cuerpo',
        'articulo',
        'paragrafo_normativo',
        'titulo_parte'
    ];

    selectorsToInspect.forEach(selectorName => {
        // Expresión regular robusta para capturar el bloque de la regla CSS (.selector { ... })
        const regex = new RegExp(`\\.(${selectorName})\\s*\\{([^}]*)\\}`, 'm');
        const match = cssText.match(regex);

        console.log(`------------------------------------------------------------`);
        if (match) {
            console.log(`[SELECTOR] .${match[1]}`);
            const declarations = match[2]
                .split(';')
                .map(d => d.trim())
                .filter(d => d.length > 0);

            if (declarations.length > 0) {
                declarations.forEach(dec => {
                    console.log(`  ${dec};`);
                });
            } else {
                console.log(`  (Regla declarativa vacía o basada en herencia / comentario)`);
            }
        } else {
            console.log(`[SELECTOR .${selectorName}] ❌ No encontrado como regla directa en el CSS.`);
        }
    });

    console.log('\n============================================================');
    console.log('   INVENTARIO E12.3-BASE CONCLUIDO. LISTO PARA DEFINIR PERFIL');
    console.log('============================================================');
}

auditarMetricasCSS();