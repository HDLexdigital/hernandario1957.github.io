'use strict';

const JSZip = require('jszip');
const { extractNodeText } = require('../compiler/src/semanticCompiler');

// Constantes
const MIMETYPE = 'application/epub+zip';
const FIXED_DATE = new Date('1980-01-01T00:00:00Z');

// Escapado
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeXml(value) {
    return escapeHtml(value);
}

// Renderizar nodo LEDM a XHTML
function renderNode(node) {
    if (!node) return '';
    if (node.type === 'text') return escapeHtml(node.text || '');
    const content = (node.children || []).map(renderNode).join('');
    if (node.type === 'strong') return `<strong>${content}</strong>`;
    return content;
}

// Renderizar bloque LEDM a XHTML
function renderBlockXhtml(block) {
    const content = (block.children || []).map(renderNode).join('');
    switch (block.type) {
        case 'title': return `<h1>${content}</h1>`;
        case 'article': return `<article>${content}</article>`;
        case 'paragraph': return `<p>${content}</p>`;
        default: return `<div>${content}</div>`;
    }
}

// Generar un archivo XHTML para un bloque
function generateXhtmlContent(block, title, index) {
    const bodyContent = renderBlockXhtml(block);
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="es-CO">
<head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" type="text/css" href="../css/publication.css" />
</head>
<body>
    <main>
        ${bodyContent}
    </main>
</body>
</html>`;
}

// Generar nav.xhtml
function generateNavXhtml(blocks) {
    const items = blocks.map((block, index) => {
        const padded = String(index + 1).padStart(3, '0');
        const href = `xhtml/article-${padded}.xhtml`;
        const label = escapeHtml(extractNodeText(block).substring(0, 50) || block.nodeId);
        return `<li><a href="${href}">${label}</a></li>`;
    }).join('\n            ');

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="es-CO">
<head>
    <meta charset="UTF-8" />
    <title>Tabla de contenido</title>
</head>
<body>
    <nav epub:type="toc" aria-label="Tabla de contenido">
        <ol>
            ${items}
        </ol>
    </nav>
</body>
</html>`;
}

// Generar content.opf
function generateOpf(ledm, blockCount) {
    const title = escapeXml(ledm.structure?.title || 'Documento');
    const modified = ledm.provenance?.retrievedAt || '2026-01-01T00:00:00Z';
    const language = ledm.meta?.jurisdiction === 'CO' ? 'es-CO' : 'es';

    const manifestItems = [];
    const spineItems = [];

    manifestItems.push(`<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`);
    manifestItems.push(`<item id="css" href="css/publication.css" media-type="text/css"/>`);

    for (let i = 1; i <= blockCount; i++) {
        const padded = String(i).padStart(3, '0');
        const id = `article-${padded}`;
        const href = `xhtml/article-${padded}.xhtml`;
        manifestItems.push(`<item id="${id}" href="${href}" media-type="application/xhtml+xml"/>`);
        spineItems.push(`<itemref idref="${id}"/>`);
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:identifier id="pub-id">${escapeXml(ledm.meta?.documentId || 'lexdigital')}</dc:identifier>
        <dc:title>${title}</dc:title>
        <dc:language>${language}</dc:language>
        <meta property="dcterms:modified">${escapeXml(modified)}</meta>
    </metadata>
    <manifest>
        ${manifestItems.join('\n        ')}
    </manifest>
    <spine>
        ${spineItems.join('\n        ')}
    </spine>
</package>`;
}

// Generar container.xml
function generateContainer() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
        <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
    </rootfiles>
</container>`;
}

// Generar CSS mínimo
function generateCss() {
    return `body { font-family: serif; }
article { margin: 1rem 0; }
h1 { font-size: 1.5em; }
strong { font-weight: bold; }
p { margin: 0.5em 0; }`;
}

/**
 * Genera un EPUB a partir de un LEDM 2.0 válido.
 * @param {object} ledm - Documento LEDM 2.0
 * @returns {Promise<Buffer>} Buffer con el archivo .epub
 */
async function generateEpub(ledm) {
    if (!ledm || ledm.meta?.model !== 'LEDM-2.0' || !Array.isArray(ledm.structure?.blocks)) {
        throw new Error('LEDM inválido para generación EPUB');
    }
    const blocks = ledm.structure.blocks;
    if (blocks.length === 0) {
        throw new Error('LEDM no contiene bloques');
    }

    const zip = new JSZip();
    const date = FIXED_DATE;

    // Agregar mimetype sin compresión y como primera entrada
    zip.file('mimetype', MIMETYPE, { compression: 'STORE', date });
    zip.file('META-INF/container.xml', generateContainer(), { date });
    zip.file('OEBPS/content.opf', generateOpf(ledm, blocks.length), { date });
    zip.file('OEBPS/nav.xhtml', generateNavXhtml(blocks), { date });
    zip.file('OEBPS/css/publication.css', generateCss(), { date });

    // Agregar archivos XHTML por bloque
    blocks.forEach((block, index) => {
        const padded = String(index + 1).padStart(3, '0');
        const filename = `OEBPS/xhtml/article-${padded}.xhtml`;
        const content = generateXhtmlContent(block, block.nodeId || `Artículo ${index + 1}`, index + 1);
        zip.file(filename, content, { date });
    });

    const buffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
        platform: 'DOS'
    });

    return buffer;
}

module.exports = {
    generateEpub,
    generateXhtmlContent,
    generateNavXhtml,
    generateOpf,
    generateContainer,
    generateCss
};