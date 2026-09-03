'use strict';

const JSZip = require('jszip');
const { extractNodeText } = require('../compiler/src/semanticCompiler');

const MIMETYPE = 'application/epub+zip';
const FIXED_DATE = new Date('1980-01-01T00:00:00Z');

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

function renderNode(node) {
    if (!node) return '';
    if (node.type === 'text') return escapeHtml(node.text || '');
    const content = (node.children || []).map(renderNode).join('');
    if (node.type === 'strong') return `<strong>${content}</strong>`;
    if (node.type === 'emphasis') return `<em>${content}</em>`;
    return content;
}

function renderBlockXhtml(block) {
    const content = (block.children || []).map(renderNode).join('');
    switch (block.type) {
        case 'title': return `<h1>${content}</h1>`;
        case 'article': return `<article>${content}</article>`;
        case 'paragraph': return `<p>${content}</p>`;
        default: return `<div>${content}</div>`;
    }
}

function chunkLedmIntoSections(blocks) {
    const sections = [];
    let currentSection = null;

    for (const block of blocks) {
        if (block.type === 'title') {
            currentSection = { titleBlock: block, blocks: [] };
            sections.push(currentSection);
        } else {
            if (!currentSection) {
                currentSection = { titleBlock: null, blocks: [] };
                sections.push(currentSection);
            }
            currentSection.blocks.push(block);
        }
    }

    return sections;
}

function generateSectionXhtml(section, sectionIndex) {
    const title = section.titleBlock
        ? extractNodeText(section.titleBlock)
        : `Sección ${sectionIndex + 1}`;

    const contentParts = [];
    if (section.titleBlock) {
        contentParts.push(renderBlockXhtml(section.titleBlock));
    }
    contentParts.push(...section.blocks.map(block => renderBlockXhtml(block)));

    const bodyContent = contentParts.join('\n        ');

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

function generateNavXhtml(sections) {
    const items = sections.map((section, index) => {
        const padded = String(index + 1).padStart(3, '0');
        const href = `xhtml/section-${padded}.xhtml`;
        const label = section.titleBlock
            ? escapeHtml(extractNodeText(section.titleBlock).substring(0, 80))
            : `Sección ${index + 1}`;
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

function generateOpf(ledm, sectionCount) {
    const title = escapeXml(ledm.structure?.title || 'Documento');
    const modified = ledm.provenance?.retrievedAt || '2026-01-01T00:00:00Z';
    const language = ledm.meta?.jurisdiction === 'CO' ? 'es-CO' : 'es';

    const manifestItems = [];
    const spineItems = [];

    manifestItems.push(`<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`);
    manifestItems.push(`<item id="css" href="css/publication.css" media-type="text/css"/>`);

    for (let i = 1; i <= sectionCount; i++) {
        const padded = String(i).padStart(3, '0');
        const id = `section-${padded}`;
        const href = `xhtml/section-${padded}.xhtml`;
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

function generateContainer() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
        <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
    </rootfiles>
</container>`;
}

function generateCss() {
    return `body { font-family: serif; }
article { margin: 1rem 0; }
h1 { font-size: 1.5em; }
strong { font-weight: bold; }
p { margin: 0.5em 0; }`;
}

async function generateEpub(ledm) {
    if (!ledm || ledm.meta?.model !== 'LEDM-2.0' || !Array.isArray(ledm.structure?.blocks)) {
        throw new Error('LEDM inválido para generación EPUB');
    }

    // Congelar el LEDM para evitar mutaciones accidentales entre generaciones
    const ledmFrozen = JSON.parse(JSON.stringify(ledm));

    const blocks = ledmFrozen.structure.blocks;
    if (blocks.length === 0) throw new Error('LEDM sin bloques');

    const sections = chunkLedmIntoSections(blocks);
    const zip = new JSZip();

    zip.file('mimetype', MIMETYPE, { compression: 'STORE', date: FIXED_DATE });
    zip.file('META-INF/container.xml', generateContainer(), { date: FIXED_DATE });
    zip.file('OEBPS/content.opf', generateOpf(ledmFrozen, sections.length), { date: FIXED_DATE });
    zip.file('OEBPS/nav.xhtml', generateNavXhtml(sections), { date: FIXED_DATE });
    zip.file('OEBPS/css/publication.css', generateCss(), { date: FIXED_DATE });

    sections.forEach((section, index) => {
        const padded = String(index + 1).padStart(3, '0');
        zip.file(`OEBPS/xhtml/section-${padded}.xhtml`, generateSectionXhtml(section, index), { date: FIXED_DATE });
    });

    return await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
        platform: 'DOS'
    });
}

module.exports = {
    generateEpub,
    generateSectionXhtml,
    generateNavXhtml,
    generateOpf,
    generateContainer,
    generateCss,
    chunkLedmIntoSections
};