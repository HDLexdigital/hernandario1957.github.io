'use strict';

const { execSync } = require('child_process');

console.log('🛫 Ejecutando pre-vuelo...');

const comandos = [
    'node scripts/validate-document-json.js modelos-referencia/modelo-documento-juridico.json',
    'node scripts/build-integrity-report.js',
    'node tests-estres/ejecutar-pruebas.js'
];

comandos.forEach(cmd => {
    console.log('\n▶ ' + cmd);
    try {
        execSync(cmd, { cwd: process.cwd(), stdio: 'inherit' });
    } catch {
        console.log('⚠️ Falló: ' + cmd);
    }
});

console.log('\n✅ Pre-vuelo finalizado.');
