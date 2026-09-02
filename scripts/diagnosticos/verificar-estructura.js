'use strict';
const fs = require('fs');
const path = require('path');
console.log('=============================================');
console.log('   VERIFICACIÓN DE ESTRUCTURA LEXDIGITAL');
console.log('=============================================');
const archivosRequeridos = [
    'src/index.js',
    'src/config/default.js',
    'src/core/compiladores/compilarLexmotor.js',
    'src/core/constructores/constructorXHTML.js',
    'src/core/utils/validadorJson.js',
    'src/core/utils/clasificadorLegal.js',
    'LexDigital-Pipeline/server.js',
    'lexmotor-uxp-plugin/manifest.json'
];
let todoOk = true;
for (const archivo of archivosRequeridos) {
    if (fs.existsSync(archivo)) {
        const size = fs.statSync(archivo).size;
        console.log('✅ ' + archivo + ' (' + size + ' bytes)');
    } else {
        console.log('❌ FALTA: ' + archivo);
        todoOk = false;
    }
}
// Verificar que no haya duplicados
console.log('\n--- Verificación de duplicados ---');
const duplicados = [
    'core/clasificadorLegal.js',
    'src/compiladores/',
    'src/constructores/',
    'src/validadores/',
    'src/utils/'
];
for (const dup of duplicados) {
    if (fs.existsSync(dup)) {
        console.log('⚠️ Aún existe: ' + dup);
    } else {
        console.log('✅ Eliminado: ' + dup);
    }
}
// Probar carga del módulo principal
console.log('\n--- Prueba de carga ---');
try {
    const lexdigital = require('../src');
    console.log('✅ Módulo principal cargado correctamente');
    console.log('   Versión: ' + lexdigital.version);
} catch (e) {
    console.log('❌ Error cargando módulo principal: ' + e.message);
    todoOk = false;
}
console.log('\n=============================================');
if (todoOk) {
    console.log('   ✅ ESTRUCTURA CORRECTA');
} else {
    console.log('   ❌ HAY PROBLEMAS QUE RESOLVER');
}
console.log('=============================================');
process.exit(todoOk ? 0 : 1);
