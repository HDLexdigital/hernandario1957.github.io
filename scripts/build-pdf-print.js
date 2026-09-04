'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { compile, extractNodeText } = require('../core/compiler/src/semanticCompiler');

const RAIZ = path.join(__dirname, '..');
const CIDM_PATH = path.join(RAIZ, 'core', 'integration', 'fixtures', 'authentic', 'CIDM_real.json');
const LEDM_TMP = '/tmp/ledm-print-full.json';
const HTML_PRINT = path.join(RAIZ, 'output', 'debug-print.html');
const PDF_BASE = path.join(RAIZ, 'output', 'experiment-print-base.pdf');

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function generarHtmlPlano(ledm) {
    const bloques = ledm.structure.blocks || [];
    let body = '';

    for (const block of bloques) {
        const text = extractNodeText(block);
        switch (block.type) {
            case 'title':
                body += `<h1>${escapeHtml(text)}</h1>\n`;
                break;
            case 'article':
                body += `<div class="ld-articulo">${escapeHtml(text)}</div>\n`;
                break;
            case 'paragraph':
                body += `<p>${escapeHtml(text)}</p>\n`;
                break;
            default:
                body += `<p>${escapeHtml(text)}</p>\n`;
        }
    }

    return `<!DOCTYPE html>
<html lang="es-CO">
<head>
    <meta charset="UTF-8">
    <title>${escapeHtml(ledm.structure?.title || 'Documento')}</title>
</head>
<body>
    <main>
${body}
    </main>
</body>
</html>`;
}

function main() {
    console.log('📄 Generando LEDM desde CIDM real...');
    const cidm = JSON.parse(fs.readFileSync(CIDM_PATH, 'utf8'));
    const ledm = compile(cidm);
    fs.writeFileSync(LEDM_TMP, JSON.stringify(ledm, null, 2), 'utf8');
    console.log(`✅ LEDM guardado en ${LEDM_TMP}`);

    console.log('🧪 Generando HTML plano para imprenta...');
    const html = generarHtmlPlano(ledm);

    fs.mkdirSync(path.dirname(HTML_PRINT), { recursive: true });
    fs.writeFileSync(HTML_PRINT, html, 'utf8');
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