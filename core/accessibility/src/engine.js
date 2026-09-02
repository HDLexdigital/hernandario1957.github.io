'use strict';

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizeId(nodeId) {
    return String(nodeId)
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9_.:-]/g, '-');
}

function extractNodeText(node) {
    if (!node) return '';
    if (node.type === 'text') return node.text || '';
    return (node.children || []).map(extractNodeText).join('');
}

function extractBlockText(block) {
    return extractNodeText(block);
}

function getNavLabel(block) {
    const raw = extractBlockText(block);
    const match = raw.match(/^(Artículo\s+\d+)/i);
    if (match) return match[1];
    return raw.substring(0, 30).trim() || block.nodeId;
}

function renderNode(node) {
    if (!node) return '';
    if (node.type === 'text') return escapeHtml(node.text || '');
    const content = (node.children || []).map(renderNode).join('');
    if (node.type === 'strong') return `<strong>${content}</strong>`;
    return content; // Otros tipos se renderizan sin etiqueta extra
}

function renderBlock(block) {
    const id = escapeHtml(normalizeId(block.nodeId));
    const content = (block.children || []).map(renderNode).join('');

    switch (block.type) {
        case 'title':
            return `<section id="${id}" aria-labelledby="${id}-heading">
        <h2 id="${id}-heading">${content}</h2>
    </section>`;
        case 'article':
            return `<article id="${id}">
        <h3>${content}</h3>
    </article>`;
        case 'paragraph':
            return `<p id="${id}">${content}</p>`;
        default:
            return `<div id="${id}">${content}</div>`;
    }
}

function renderStructuralNavigation(blocks) {
    if (!blocks.length) return '';

    const items = blocks.map((block) => {
        const href = escapeHtml(normalizeId(block.nodeId));
        const label = escapeHtml(getNavLabel(block));
        return `<li><a href="#${href}">${label}</a></li>`;
    }).join('\n            ');

    return `<nav aria-label="Navegación del documento">
        <ol>
            ${items}
        </ol>
    </nav>`;
}

function assertValidLedm(ledm) {
    if (!ledm || ledm.meta?.model !== 'LEDM-2.0') {
        throw new Error('El motor de accesibilidad requiere un documento LEDM 2.0 válido.');
    }
    if (!ledm.structure || !Array.isArray(ledm.structure.blocks)) {
        throw new Error('El LEDM debe contener una estructura con bloques.');
    }
}

function renderLedmToHtml(ledm) {
    assertValidLedm(ledm);

    const docTitle = escapeHtml(ledm.structure.title || 'Documento Jurídico');
    const jurisdiction = ledm.meta.jurisdiction || 'CO';
    const lang = jurisdiction === 'CO' ? 'es-CO' : 'es';
    const sourceId = escapeHtml(ledm.provenance?.sourceId || '');

    const blocks = ledm.structure.blocks;
    const navigation = renderStructuralNavigation(blocks);
    const mainContent = blocks.map(renderBlock).join('\n        ');

    const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${docTitle}</title>
    <meta name="generator" content="LexDigitalHD Accessibility Engine v0.1">
    ${sourceId ? `<meta name="dc.source" content="${sourceId}">` : ''}
</head>
<body>
    <header>
        <h1>${docTitle}</h1>
    </header>
    ${navigation}
    <main>
        ${mainContent}
    </main>
</body>
</html>`;

    return html;
}

module.exports = {
    renderLedmToHtml,
    escapeHtml,
    normalizeId,
    extractNodeText,
    getNavLabel,
    renderBlock
};