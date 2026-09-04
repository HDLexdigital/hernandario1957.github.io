'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { renderHtml } = require('../core/web/WebRenderer');

const RAIZ = path.join(__dirname, '..');
const CIDM_PATH = path.join(RAIZ, 'core', 'integration', 'fixtures', 'authentic', 'CIDM_real.json');
const LEDM_TMP = '/tmp/ledm-print-full.json';
const HTML_PRINT = path.join(RAIZ, 'output', 'debug-print.html');
const PDF_BASE = path.join(RAIZ, 'output', 'experiment-print-base.pdf');

function main() {
    console.log('📄 Generando LEDM desde CIDM real...');
    const { compile } = require('../core/compiler/src/semanticCompiler');
    const cidm = JSON.parse(fs.readFileSync(CIDM_PATH, 'utf8'));
    const ledm = compile(cidm);
    fs.writeFileSync(LEDM_TMP, JSON.stringify(ledm, null, 2), 'utf8');
    console.log(`✅ LEDM guardado en ${LEDM_TMP}`);

    console.log('🧪 Generando HTML con bundles de imprenta...');
    const html = renderHtml(ledm);
    const htmlSinNav = html.replace(/<nav[^>]*>[\s\S]*?<\/nav>/g, '');

    fs.mkdirSync(path.dirname(HTML_PRINT), { recursive: true });
    fs.writeFileSync(HTML_PRINT, htmlSinNav, 'utf8');
    console.log('💾 HTML de imprenta guardado.');

    const baseCss = path.join(RAIZ, 'core', 'styles', 'base.css');
    const pagedMediaCss = path.join(RAIZ, 'core', 'styles', 'paged-media.css');
    const printCss = path.join(RAIZ, 'core', 'styles', 'print.css');

    const args = [
        '-s', baseCss,
        '-s', pagedMediaCss,
        '-s', printCss,
        HTML_PRINT,
        PDF_BASE
    ];

    console.log('🖨️ Generando PDF base con WeasyPrint...');
    execFileSync('weasyprint', args, { stdio: 'inherit' });

    console.log(`✅ PDF base generado en: ${PDF_BASE}`);
}

try {
    main();
} catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
}