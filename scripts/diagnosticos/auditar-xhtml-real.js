/**
 * E18.2.3.4 — Script de Auditoría Empírica del Corpus XHTML Real
 * Ubicación sugerida: scripts/auditar-xhtml-real.js
 * Propósito: Observación pasiva e inventario de clases, atributos y estructura.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const salidaDir = path.join(__dirname, '../salidaXHTML');

function auditarXHTML() {
    console.log('====================================================');
    console.log('  🔍 INICIANDO AUDITORÍA EMPÍRICA DE XHTML REAL');
    console.log(`  📂 Ruta: ${salidaDir}`);
    console.log('====================================================\n');

    if (!fs.existsSync(salidaDir)) {
        console.error(`❌ Error: El directorio ${salidaDir} no existe.`);
        return;
    }

    const archivos = fs.readdirSync(salidaDir).filter(f => f.endsWith('.html') || f.endsWith('.xhtml'));
    
    if (archivos.length === 0) {
        console.log('⚠️ Advertencia: No se encontraron archivos XHTML/HTML en la carpeta de salida.');
        return;
    }

    console.log(`📄 Archivos encontrados: ${archivos.length}\n`);

    let totalNodosGlobal = 0;
    const inventarioClases = new Map();
    const inventarioAtributosId = new Map();
    const inventarioAtributosData = new Map();
    const tagsEncontrados = new Map();

    // Como estamos en un entorno Node sin un DOM parser pesado instalado por defecto,
    // podemos realizar un análisis basado en regex segura o parser ligero si está disponible,
    // o inspeccionar las líneas/fragmentos clave del corpus.
    
    archivos.forEach(archivo => {
        const filePath = path.join(salidaDir, archivo);
        const contenido = fs.readFileSync(filePath, 'utf8');
        
        console.log(`--- Analizando archivo: ${archivo} (${contenido.length} bytes) ---`);

        // Detección simple de tags, clases e IDs mediante regex de inspección pasiva
        const tagMatches = contenido.match(/<([a-z0-9-]+)(?:\s+[^>]*>|[\s>])/gi) || [];
        totalNodosGlobal += tagMatches.length;

        // Extraer clases (class="...")
        const classMatches = contenido.match(/class=["']([^"']+)["']/gi) || [];
        classMatches.forEach(m => {
            const val = m.replace(/class=["']/i, '').replace(/["']/g, '');
            val.split(/\s+/).forEach(c => {
                inventarioClases.set(c, (inventarioClases.get(c) || 0) + 1);
            });
        });

        // Extraer IDs (id="...")
        const idMatches = contenido.match(/id=["']([^"']+)["']/gi) || [];
        idMatches.forEach(m => {
            const val = m.replace(/id=["']/i, '').replace(/["']/g, '');
            inventarioAtributosId.set(val, (inventarioAtributosId.get(val) || 0) + 1);
        });

        // Extraer data-* o atributos candidatos de identidad jurídica
        const dataMatches = contenido.match(/data-[a-z0-9-_]+=["'][^"']+["']/gi) || [];
        dataMatches.forEach(m => {
            inventarioAtributosData.set(m, (inventarioAtributosData.get(m) || 0) + 1);
        });
    });

    console.log('\n====================================================');
    console.log('  📊 RESULTADOS DE LA AUDITORÍA EMPÍRICA');
    console.log('====================================================');
    console.log(`Total estimado de nodos / etiquetas inspeccionadas: ${totalNodosGlobal}`);
    
    console.log('\n--- Inventario de Clases CSS Frecuentes ---');
    const clasesOrdenadas = Array.from(inventarioClases.entries()).sort((a, b) => b[1] - a[1]);
    clasesOrdenadas.slice(0, 20).forEach(([cls, freq]) => {
        console.log(`  [${freq}x] clase: "${cls}"`);
    });

    console.log('\n--- Inventario de Atributos id Encontrados ---');
    if (inventarioAtributosId.size === 0) {
        console.log('  (Ningún atributo id presente en el corpus real)');
    } else {
        const idsOrdenados = Array.from(inventarioAtributosId.entries()).sort((a, b) => b[1] - a[1]);
        idsOrdenados.slice(0, 20).forEach(([idVal, freq]) => {
            console.log(`  [${freq}x] id: "${idVal}"`);
        });
    }

    console.log('\n--- Inventario de Atributos data-* Encontrados ---');
    if (inventarioAtributosData.size === 0) {
        console.log('  (Ningún atributo data-* presente en el corpus real)');
    } else {
        inventarioAtributosData.forEach((freq, attr) => {
            console.log(`  [${freq}x] ${attr}`);
        });
    }
    console.log('====================================================\n');
}

auditarXHTML();