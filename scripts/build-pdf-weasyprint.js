'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { renderHtml } = require('../core/web/WebRenderer');

const RAIZ = path.join(__dirname, '..');
const DEFAULT_INPUT = path.join(RAIZ, 'core', 'ledm', 'fixtures', 'constitution-art1.valid.json');
const DEFAULT_OUTPUT = path.join(RAIZ, 'output', 'experiment-weasyprint-ua.pdf');
const HTML_INTERMEDIO = path.join(RAIZ, 'output', 'debug-weasyprint.html');

function generarPdfConWeasyPrint(ledm, outputPath) {
    const html = renderHtml(ledm);

    // Eliminar nav para que no aparezca en el PDF
    const htmlSinNav = html.replace(/<nav[^>]*>[\s\S]*?<\/nav>/g, '');

    // Guardar HTML intermedio
    fs.mkdirSync(path.dirname(HTML_INTERMEDIO), { recursive: true });
    fs.writeFileSync(HTML_INTERMEDIO, htmlSinNav, 'utf8');

    const baseCss = path.join(RAIZ, 'core', 'styles', 'base.css');
    const pagedMediaCss = path.join(RAIZ, 'core', 'styles', 'paged-media.css');

    const args = [
        '--pdf-variant', 'pdf/ua-1',
        '-s', baseCss,
        '-s', pagedMediaCss,
        HTML_INTERMEDIO,
        outputPath
    ];

    console.log('🧪 Ejecutando WeasyPrint en modo PDF/UA-1...');
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