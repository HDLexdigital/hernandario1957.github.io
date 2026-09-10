'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..', '..', '..', '..');
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

function compilarPdfWeasyPrint(inputPath, outputPath) {
    const { extractNodeText } = require(path.join(RAIZ, 'core', 'compiler', 'src', 'semanticCompiler'));

    const inPath = inputPath || DEFAULT_INPUT;
    const outPath = outputPath || DEFAULT_OUTPUT;

    console.log('📄 Leyendo LEDM desde: ' + path.basename(inPath));
    const ledm = JSON.parse(fs.readFileSync(inPath, 'utf8'));

    const html = generarHtmlPlano(ledm, extractNodeText);

    fs.mkdirSync(path.dirname(HTML_INTERMEDIO), { recursive: true });
    fs.writeFileSync(HTML_INTERMEDIO, html, 'utf8');

    const baseCss = path.join(RAIZ, 'core', 'styles', 'base.css');
    const pagedMediaCss = path.join(RAIZ, 'core', 'styles', 'paged-media.css');

    const args = ['-s', baseCss, '-s', pagedMediaCss, HTML_INTERMEDIO, outPath];

    execFileSync('weasyprint', args, { stdio: 'inherit' });
    console.log('✅ PDF/UA-1 generado en: ' + outPath);
    return outPath;
}

module.exports = { compilarPdfWeasyPrint };
