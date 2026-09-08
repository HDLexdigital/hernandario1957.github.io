'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const CIDM_PATH = path.join(RAIZ, 'core', 'integration', 'fixtures', 'authentic', 'CIDM_real.json');
const LEDM_TMP = '/tmp/ledm-full.json';
const OUTPUT_PDF = path.join(RAIZ, 'output', 'experiment-weasyprint-ua-full.pdf');

function main() {
    console.log('📄 Generando LEDM desde CIDM real...');
    const { compile } = require('../core/compiler/src/semanticCompiler');
    const cidm = JSON.parse(fs.readFileSync(CIDM_PATH, 'utf8'));
    const ledm = compile(cidm);
    fs.writeFileSync(LEDM_TMP, JSON.stringify(ledm, null, 2), 'utf8');
    console.log(`✅ LEDM guardado en ${LEDM_TMP}`);

    console.log('🧪 Generando PDF con WeasyPrint...');
    const buildScript = path.join(RAIZ, 'scripts', 'build-pdf-weasyprint.js');
    execSync(`node "${buildScript}" "${LEDM_TMP}" "${OUTPUT_PDF}"`, { stdio: 'inherit' });

    console.log(`✅ PDF generado en ${OUTPUT_PDF}`);
}

try {
    main();
} catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
}