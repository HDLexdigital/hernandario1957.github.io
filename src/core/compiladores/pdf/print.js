'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..', '..', '..', '..');
const DEFAULT_LEDM = path.join(RAIZ, 'core', 'compiler', 'fixtures', 'ledm-expected.json');
const DEFAULT_OUTPUT = path.join(RAIZ, 'output', 'experiment-print-base.pdf');
const HTML_PRINT = path.join(RAIZ, 'output', 'debug-print.html');

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function generarHtmlPlano(ledm, extractNodeText) {
    const bloques = ledm.structure.blocks || [];
    let body = '';
    for (const block of bloques) {
        const text = extractNodeText(block);
        switch (block.type) {
            case 'title':
                body += '<h1>' + escapeHtml(text) + '</h1>\n';
                break;
            case 'article':
                body += '<div class="ld-articulo">' + escapeHtml(text) + '</div>\n';
                break;
            case 'paragraph':
                body += '<p>' + escapeHtml(text) + '</p>\n';
                break;
            default:
                body += '<p>' + escapeHtml(text) + '</p>\n';
        }
    }
    return '<!DOCTYPE html>\n<html lang="es-CO">\n<head>\n    <meta charset="UTF-8">\n    <title>' + escapeHtml(ledm.structure && ledm.structure.title ? ledm.structure.title : 'Documento') + '</title>\n</head>\n<body>\n    <main>\n' + body + '    </main>\n</body>\n</html>';
}

function compilarPdfPrint(ledmPath, outputPath) {
    const { extractNodeText } = require(path.join(RAIZ, 'core', 'compiler', 'src', 'semanticCompiler'));

    const inPath = ledmPath || DEFAULT_LEDM;
    const outPath = outputPath || DEFAULT_OUTPUT;

    console.log('📄 Leyendo LEDM desde: ' + path.basename(inPath));
    const ledm = JSON.parse(fs.readFileSync(inPath, 'utf8'));

    console.log('🧪 Generando HTML plano para imprenta...');
    const html = generarHtmlPlano(ledm, extractNodeText);

    fs.mkdirSync(path.dirname(HTML_PRINT), { recursive: true });
    fs.writeFileSync(HTML_PRINT, html, 'utf8');
    console.log('💾 HTML de imprenta guardado.');

    const baseCss = path.join(RAIZ, 'core', 'styles', 'base.css');
    const pagedMediaCss = path.join(RAIZ, 'core', 'styles', 'paged-media.css');
    const printCss = path.join(RAIZ, 'core', 'styles', 'print.css');

    const args = ['-s', baseCss, '-s', pagedMediaCss, '-s', printCss, HTML_PRINT, outPath];

    console.log('🖨️ Generando PDF base con WeasyPrint...');
    execFileSync('weasyprint', args, { stdio: 'inherit' });
    console.log('✅ PDF base generado en: ' + outPath);
    return outPath;
}

module.exports = { compilarPdfPrint };
