'use strict';

const fs = require('fs');
const path = require('path');
const { compilarLexmotor } = require('../src/index');
const { adaptarInDesign } = require('../src/adaptadores/InDesignAdapter');

async function inspeccionarContratoAST() {
    console.log('============================================================');
    console.log('       E12.0 — INSPECCIÓN EMPÍRICA DEL CONTRATO DE AST');
    console.log('============================================================');

    const fixturePath = path.join(__dirname, '../test/fixtures/raw/fragmento-211.json');
    const semanticMapPath = path.join(__dirname, '../test/fixtures/raw/fragmento-211.semantic_map.json');

    if (!fs.existsSync(fixturePath)) {
        console.error(`[ERROR] No se encuentra el fixture en: ${fixturePath}`);
        return;
    }

    const fixtureRaw = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    const semanticMap = fs.existsSync(semanticMapPath) 
        ? JSON.parse(fs.readFileSync(semanticMapPath, 'utf8')) 
        : null;

    // 1. Adaptación E10
    const adaptacion = adaptarInDesign({ jsonCrudo: fixtureRaw, semanticMap });
    
    // 2. Compilación Core
    const resultado = await compilarLexmotor(
        adaptacion.ast,
        'fragmento-211',
        'fragmento-211.css'
    );

    const nodos = resultado.jsonOficial.tokens || resultado.jsonOficial.contenido || [];

    console.log(`[E12.0] Total de nodos en el AST canónico: ${nodos.length}\n`);

    // 3. Inspección de la dualidad nodo.texto vs nodo.contenido
    const nodosConTextoVacioEnRaiz = nodos.filter(nodo => nodo.texto === '[VACÍO]');
    console.log(`[E12.0] Nodos con nodo.texto === "[VACÍO]": ${nodosConTextoVacioEnRaiz.length}`);

    if (nodosConTextoVacioEnRaiz.length > 0) {
        console.log('\n--- MUESTRA DE NODOS CON [VACÍO] EN RAÍZ ---');
        nodosConTextoVacioEnRaiz.slice(0, 3).forEach((nodo, idx) => {
            console.log(`\n[Nodo #${idx} ID=${nodo.id}]`);
            console.log(`  - estiloParrafo :`, nodo.estiloParrafo);
            console.log(`  - nodo.texto    :`, nodo.texto);
            console.log(`  - nodo.contenido:`, JSON.stringify(nodo.contenido, null, 2));
        });
    }

    // 4. Verificación de contenido real en sub-elementos
    const conContenidoReal = nodosConTextoVacioEnRaiz.filter(
        nodo => Array.isArray(nodo.contenido) && nodo.contenido.length > 0 && nodo.contenido.some(c => c.texto && c.texto !== '[VACÍO]')
    );
    console.log(`\n[E12.0] Nodos con raíz "[VACÍO]" que SÍ tienen texto útil en su "contenido": ${conContenidoReal.length}`);

    console.log('\n============================================================');
    console.log('   INSPECCIÓN CONCLUIDA. LISTO PARA DEFINIR CONTRATO E12.1');
    console.log('============================================================');
}

inspeccionarContratoAST().catch(err => {
    console.error('[FATAL] Error durante la inspección E12.0:', err);
});