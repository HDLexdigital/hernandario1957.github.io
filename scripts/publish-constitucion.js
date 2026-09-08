'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const CIDM_REAL = path.join(RAIZ, 'core', 'integration', 'fixtures', 'authentic', 'CIDM_real.json');
const TEMP_LEDM = path.join(RAIZ, 'tmp-ledm.json');
const PUBLISH_SCRIPT = path.join(RAIZ, 'scripts', 'publish.js');

function main() {
    console.log('📄 Compilando CIDM real a LEDM...');
    const { compile } = require('../core/compiler/src/semanticCompiler');
    const cidm = JSON.parse(fs.readFileSync(CIDM_REAL, 'utf8'));
    const ledm = compile(cidm);
    fs.writeFileSync(TEMP_LEDM, JSON.stringify(ledm, null, 2), 'utf8');
    console.log('✅ LEDM temporal generado.');

    console.log('🚀 Ejecutando orquestador de publicación...');
    execFileSync('node', [PUBLISH_SCRIPT, TEMP_LEDM], { stdio: 'inherit' });
    console.log('✅ Publicación de la Constitución completada.');
}

try {
    main();
} catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
}
