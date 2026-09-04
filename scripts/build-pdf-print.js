'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

    console.log('🧪 Generando HTML con CSS Paged Media para imprenta...');
    const { renderHtml } = require('../core/web/WebRenderer');
    const html = renderHtml(ledm);

    const cssPrint = `
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
        `<style>${cssPrint}</style>\n</head>`
    );

    fs.mkdirSync(path.dirname(HTML_PRINT), { recursive: true });
    fs.writeFileSync(HTML_PRINT, htmlConCss, 'utf8');
    console.log('💾 HTML de imprenta guardado.');

    console.log('🖨️ Generando PDF base con WeasyPrint...');
    execSync(`weasyprint "${HTML_PRINT}" "${PDF_BASE}"`, { stdio: 'inherit' });
    console.log(`✅ PDF base generado en ${PDF_BASE}`);
}

try {
    main();
} catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
}
