'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { renderHtml } = require('../core/web/WebRenderer');

const RAIZ = path.join(__dirname, '..');
const DEFAULT_INPUT = path.join(RAIZ, 'core', 'ledm', 'fixtures', 'constitution-art1.valid.json');
const DEFAULT_OUTPUT = path.join(RAIZ, 'output', 'experiment-weasyprint.pdf');
const HTML_INTERMEDIO = path.join(RAIZ, 'output', 'debug-weasyprint.html');

async function generarPdfConWeasyPrint(ledm, outputPath) {
    const html = renderHtml(ledm);

    const cssPaged = `
        nav {
            display: none;
        }
        @page {
            size: A4;
            margin: 25mm 20mm 25mm 30mm;
            @top-center {
                content: string(currentTitle);
            }
            @bottom-right {
                content: counter(page);
            }
        }
        article {
            break-inside: avoid;
        }
        h1, h2, h3, h4, h5, h6 {
            break-after: avoid;
        }
        p {
            orphans: 2;
            widows: 2;
        }
    `;

    const htmlConCss = html.replace(
        '</head>',
        `<style>${cssPaged}</style>\n</head>`
    );

    // Guardar HTML para depuración
    fs.mkdirSync(path.dirname(HTML_INTERMEDIO), { recursive: true });
    fs.writeFileSync(HTML_INTERMEDIO, htmlConCss, 'utf8');
    console.log('💾 HTML intermedio guardado en output/debug-weasyprint.html');

    // Invocar WeasyPrint con PDF/UA
    const comando = `weasyprint --pdf-variant pdf/ua-1 "${HTML_INTERMEDIO}" "${outputPath}"`;
    console.log('🧪 Ejecutando WeasyPrint en modo PDF/UA...');
    execSync(comando, { stdio: 'inherit' });

    console.log(`✅ PDF generado en: ${outputPath}`);
}

async function main() {
    const inputPath = process.argv[2] || DEFAULT_INPUT;
    const outputPath = process.argv[3] || DEFAULT_OUTPUT;

    console.log(`📄 Leyendo LEDM desde: ${path.basename(inputPath)}`);
    const ledm = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

    await generarPdfConWeasyPrint(ledm, outputPath);
}

main().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});