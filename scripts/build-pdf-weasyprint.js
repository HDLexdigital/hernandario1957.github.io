'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { compile, extractNodeText } = require('../core/compiler/src/semanticCompiler');

const RAIZ = path.join(__dirname, '..');
const DEFAULT_INPUT = path.join(RAIZ, 'core', 'ledm', 'fixtures', 'constitution-art1.valid.json');
const DEFAULT_OUTPUT = path.join(RAIZ, 'output', 'experiment-weasyprint-ua-full.pdf');
const HTML_INTERMEDIO = path.join(RAIZ, 'output', 'debug-weasyprint.html');

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

function generarPdfConWeasyPrint(ledm, outputPath) {
    const html = generarHtmlPlano(ledm);

    fs.mkdirSync(path.dirname(HTML_INTERMEDIO), { recursive: true });
    fs.writeFileSync(HTML_INTERMEDIO, html, 'utf8');

    const baseCss = path.join(RAIZ, 'core', 'styles', 'base.css');
    const pagedMediaCss = path.join(RAIZ, 'core', 'styles', 'paged-media.css');

    const args = [
        '--pdf-variant', 'pdf/ua-1',
        '-s', baseCss,
        '-s', pagedMediaCss,
        HTML_INTERMEDIO,
        outputPath
    ];

    execFileSync('weasyprint', args, { stdio: 'inherit' });
    console.log(`✅ PDF/UA-1 generado en: ${outputPath}`);
}

async function main() {
    const inputPath = process.argv[2] || DEFAULT_INPUT;
    const outputPath = process.argv[3] || DEFAULT_OUTPUT;

    console.log(`📄 Leyendo LEDM desde: ${path.basename(inputPath)}`);
    const ledm = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    generarPdfConWeasyPrint(ledm, outputPath);
}

try {
    main();
} catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
}