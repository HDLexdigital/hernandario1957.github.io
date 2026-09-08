'use strict';

const fs = require('fs');
const path = require('path');

const { compile } = require('../core/compiler/src/semanticCompiler');
const { renderHtml } = require('../core/web/WebRenderer');

const RAIZ = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(RAIZ, 'public');
const OUTPUT_HTML = path.join(PUBLIC_DIR, 'index.html');
const OUTPUT_CSS = path.join(PUBLIC_DIR, 'styles.css');
const DEFAULT_CIDM = path.join(RAIZ, 'core', 'integration', 'fixtures', 'authentic', 'CIDM_real.json');

function generarCss() {
    return `
body {
    font-family: Georgia, serif;
    line-height: 1.6;
    margin: 0;
    padding: 0;
    background: #fafaf8;
    color: #1a1a1a;
}
nav {
    background: #2c3e50;
    color: white;
    padding: 1rem 2rem;
}
nav a {
    color: #ecf0f1;
    text-decoration: none;
}
nav a:hover {
    text-decoration: underline;
}
main {
    max-width: 900px;
    margin: 2rem auto;
    padding: 0 1rem;
}
section {
    margin-bottom: 2rem;
}
h1, h2, h3, h4, h5, h6 {
    line-height: 1.3;
}
article {
    margin-top: 1rem;
    padding-left: 1rem;
    border-left: 3px solid #ccc;
}
`.trim();
}

function buildWeb() {
    const inputCidm = process.argv[2] || DEFAULT_CIDM;

    console.log('🚀 Iniciando compilación web estática (MVP-006)...');
    console.log(`📖 CIDM de entrada: ${path.basename(inputCidm)}`);

    const cidm = JSON.parse(fs.readFileSync(inputCidm, 'utf8'));
    const ledm = compile(cidm);

    console.log('⚙️  Renderizando HTML5 semántico...');
    const html = renderHtml(ledm);

    const htmlConEstilo = html.replace(
        '</head>',
        '    <link rel="stylesheet" href="styles.css" />\n</head>'
    );

    if (fs.existsSync(PUBLIC_DIR)) {
        fs.rmSync(PUBLIC_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });

    fs.writeFileSync(OUTPUT_HTML, htmlConEstilo, 'utf8');
    fs.writeFileSync(OUTPUT_CSS, generarCss(), 'utf8');

    console.log(`✅ Sitio web generado en: ${OUTPUT_HTML}`);
    console.log(`📊 Bloques LEDM: ${ledm.structure.blocks.length}`);
    console.log(`🔗 Enlaces de navegación: ${(html.match(/<a href="#/g) || []).length}`);
    console.log(`\n🌐 Abre el archivo directamente o ejecuta:`);
    console.log(`   npx serve public`);
}

try {
    buildWeb();
} catch (error) {
    console.error('\n❌ Error crítico durante la compilación web:', error.message);
    process.exit(1);
}