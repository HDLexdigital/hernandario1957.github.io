'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { ejecutarCLI } = require('./src/cli/lexmotorCLI');

async function correrPruebas() {
    console.log('🧪 Iniciando batería de pruebas para la interfaz canónica y wrapper CLI...\n');

    const outputDir = path.join(__dirname, 'salidaTestCLI');
    const inputJson = path.join(__dirname, 'MisJSON', 'fragmento.json');
    const semanticMap = path.join(__dirname, 'estilos', 'fragmento.semantic_map.json');
    const cssFile = path.join(__dirname, 'estilos', 'fragmento.css');

    // Limpiar entorno de prueba previo
    if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true, force: true });
    }

    // PRUEBA 1: Ejecución sin --name (Fallback al nombre de entrada)
    console.log('Prueba 1: Ejecución sin --name...');
    const code1 = await ejecutarCLI([
        'compile',
        '--input', inputJson,
        '--semantic-map', semanticMap,
        '--css', cssFile,
        '--output', outputDir
    ]);
    assert.strictEqual(code1, 0, 'La ejecución sin --name debería retornar exit code 0');
    const defaultXhtml = path.join(outputDir, 'fragmento.xhtml');
    assert.strictEqual(fs.existsSync(defaultXhtml), true, 'Debe crearse fragmento.xhtml');
    console.log('   ✔️ Prueba 1 superada.\n');

    // PRUEBA 2: Ejecución con --name personalizado
    console.log('Prueba 2: Ejecución con --name salida-final...');
    const code2 = await ejecutarCLI([
        'compile',
        '--input', inputJson,
        '--semantic-map', semanticMap,
        '--css', cssFile,
        '--output', outputDir,
        '--name', 'salida-final'
    ]);
    assert.strictEqual(code2, 0, 'La ejecución con --name debería retornar exit code 0');
    const customXhtml = path.join(outputDir, 'salida-final.xhtml');
    assert.strictEqual(fs.existsSync(customXhtml), true, 'Debe crearse salida-final.xhtml');
    console.log('   ✔️ Prueba 2 superada.\n');

    // PRUEBA 3: Rechazo estricto de Path Traversal en --name
    console.log('Prueba 3: Rechazo de intento de escape (--name ../../escape)...');
    const code3 = await ejecutarCLI([
        'compile',
        '--input', inputJson,
        '--semantic-map', semanticMap,
        '--css', cssFile,
        '--output', outputDir,
        '--name', '../../escape'
    ]);
    assert.strictEqual(code3, 1, 'Debe retornar exit code 1 por violación de expresión regular de sanitización');
    console.log('   ✔️ Prueba 3 superada.\n');

    // PRUEBA 4: Ejecuciones concurrentes con nombres distintos
    console.log('Prueba 4: Ejecuciones concurrentes aisladas...');
    const [concurrentCode1, concurrentCode2] = await Promise.all([
        ejecutarCLI(['compile', '--input', inputJson, '--semantic-map', semanticMap, '--css', cssFile, '--output', outputDir, '--name', 'doc-paralelo-A']),
        ejecutarCLI(['compile', '--input', inputJson, '--semantic-map', semanticMap, '--css', cssFile, '--output', outputDir, '--name', 'doc-paralelo-B'])
    ]);
    assert.strictEqual(concurrentCode1, 0);
    assert.strictEqual(concurrentCode2, 0);
    assert.strictEqual(fs.existsSync(path.join(outputDir, 'doc-paralelo-A.xhtml')), true);
    assert.strictEqual(fs.existsSync(path.join(outputDir, 'doc-paralelo-B.xhtml')), true);
    assert.strictEqual(fs.existsSync(path.join(outputDir, 'doc-paralelo-A.semantic_map.json')), true);
    assert.strictEqual(fs.existsSync(path.join(outputDir, 'doc-paralelo-B.semantic_map.json')), true);
    console.log('   ✔️ Prueba 4 superada (Aislamiento concurrente verificado).\n');

    // PRUEBA 5: Fallo E10 no genera archivo XHTML
    console.log('Prueba 5: Fallo E10 (mapa semántico vacío o inválido) no debe crear XHTML...');
    const invalidMapPath = path.join(outputDir, 'mapa_invalido.json');
    fs.writeFileSync(invalidMapPath, JSON.stringify({ styles: [] }), 'utf8'); // Mapa vacío provocará rechazo si el documento usa estilos

    const targetFailXhtml = path.join(outputDir, 'debe-fallar.xhtml');
    if (fs.existsSync(targetFailXhtml)) fs.unlinkSync(targetFailXhtml);

    const code5 = await ejecutarCLI([
        'compile',
        '--input', inputJson,
        '--semantic-map', invalidMapPath,
        '--css', cssFile,
        '--output', outputDir,
        '--name', 'debe-fallar'
    ]);
    
    // E10 debe retornar código 3 (según el mapeo de fronteras en lexmotorCLI)
    assert.strictEqual(code5, 3, 'Debe retornar código de error 3 por rechazo de E10');
    assert.strictEqual(fs.existsSync(targetFailXhtml), false, 'El archivo XHTML no debe haberse creado ante un fallo de E10');
    console.log('   ✔️ Prueba 5 superada (Atomicidad y fail-fast comprobados).\n');

    console.log('✨ ¡Todas las pruebas de la suite CLI pasaron con éxito!');
}

correrPruebas().catch(err => {
    console.error('❌ Error fatal durante la ejecución de las pruebas:', err);
    process.exit(99);
});