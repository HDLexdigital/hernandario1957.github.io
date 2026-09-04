'use strict';

const contract = require('./mvp-006-web-publication.contract.json');

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function validarNodeId(nodeId) {
    const regex = new RegExp(contract.identifierRules.regex);
    if (!regex.test(nodeId)) {
        throw new Error(`nodeId inválido: ${nodeId}`);
    }
    return nodeId;
}

function normalizarBlocks(blocks) {
    const vistos = new Set();
    let contador = 1;
    return blocks.map(block => {
        let nodeId = block.nodeId;
        if (!nodeId) {
            nodeId = `BLOCK-${String(contador++).padStart(4, '0')}`;
        } else {
            nodeId = String(nodeId).toUpperCase();
        }
        validarNodeId(nodeId);
        if (vistos.has(nodeId)) {
            throw new Error(`nodeId duplicado: ${nodeId}`);
        }
        vistos.add(nodeId);
        return { ...block, nodeId };
    });
}

function renderContentNode(node) {
    if (!node) return '';
    if (node.type === 'text') return escapeHtml(node.text || '');

    const children = (node.children || []).map(renderContentNode).join('');
    switch (node.type) {
        case 'strong': return `<strong>${children}</strong>`;
        case 'emphasis': return `<em>${children}</em>`;
        default:
            throw new Error(`Tipo inline no soportado: ${node.type}`);
    }
}

function renderChild(node) {
    if (!node) return '';
    const blockTypes = ['title', 'article', 'paragraph'];
    if (blockTypes.includes(node.type)) {
        return renderBlock(node);
    }
    return renderContentNode(node);
}

function renderBlock(block, depth = 1) {
    if (!contract.allowedBlockTypes.includes(block.type)) {
        throw new Error(`Tipo de bloque no permitido: ${block.type}`);
    }

    const nodeId = validarNodeId(block.nodeId);
    const content = (block.children || []).map(renderChild).join('');

    switch (block.type) {
        case 'title': {
            const level = Math.min(Math.max(depth, 1), 6);
            return `<h${level} id="${escapeHtml(nodeId)}">${content}</h${level}>`;
        }
        case 'article':
            return `<article id="${escapeHtml(nodeId)}">${content}</article>`;
        case 'paragraph':
            return `<p>${content}</p>`;
        default:
            return '';
    }
}

function extractText(node) {
    if (!node) return '';
    if (node.type === 'text') return node.text || '';
    return (node.children || []).map(extractText).join('');
}

function generateStaticIndex(ledm) {
    const blocks = normalizarBlocks(ledm.structure.blocks);
    const index = [];
    const walk = (block) => {
        if (block.type === 'title' || block.type === 'article') {
            const text = extractText(block);
            index.push({
                nodeId: block.nodeId,
                title: block.type === 'title' ? text : null,
                text
            });
        }
        (block.children || []).forEach(child => {
            if (child && child.type && ['title', 'article', 'paragraph'].includes(child.type)) {
                walk(child);
            }
        });
    };
    blocks.forEach(walk);
    return index;
}

function generateNav(ledm) {
    const blocks = normalizarBlocks(ledm.structure.blocks);
    const items = [];
    const walk = (block, depth) => {
        if (block.type === 'title') {
            const nodeId = block.nodeId;
            const label = extractText(block);
            const level = Math.min(depth, 6);
            items.push(`<li><a href="#${escapeHtml(nodeId)}">${escapeHtml(label)}</a></li>`);
            depth = Math.min(depth + 1, 6);
        }
        (block.children || []).forEach(child => {
            if (child && child.type && ['title', 'article', 'paragraph'].includes(child.type)) {
                walk(child, depth);
            }
        });
    };
    blocks.forEach(block => walk(block, 1));
    return `<nav aria-label="${escapeHtml(contract.indexRules.navLabel)}"><ul>${items.join('')}</ul></nav>`;
}

function renderHtml(ledm) {
    const blocks = normalizarBlocks(ledm.structure.blocks);
    let bodyContent = '';
    let sectionOpen = false;

    const renderSection = (block, depth) => {
        if (block.type === 'title') {
            if (sectionOpen) bodyContent += '</section>\n';
            const nodeId = validarNodeId(block.nodeId);
            bodyContent += `<section aria-labelledby="${escapeHtml(nodeId)}">\n`;
            bodyContent += renderBlock(block, depth);
            sectionOpen = true;
            depth = Math.min(depth + 1, 6);
        } else {
            bodyContent += renderBlock(block, depth);
        }
    };

    blocks.forEach(block => renderSection(block, 1));
    if (sectionOpen) bodyContent += '</section>\n';

    const ledmNormalizado = { ...ledm, structure: { ...ledm.structure, blocks } };
    const nav = generateNav(ledmNormalizado);
    const staticIndex = generateStaticIndex(ledmNormalizado);

    const meta = ledm.meta || {};
    const title = escapeHtml(ledm.structure?.title || 'Documento');
    const metaTags = `
    <meta name="model" content="${escapeHtml(meta.model || '')}">
    <meta name="jurisdiction" content="${escapeHtml(meta.jurisdiction || '')}">
    <meta name="documentId" content="${escapeHtml(meta.documentId || '')}">`;

    return `<!DOCTYPE html>
<html lang="es-CO">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${metaTags}
    <title>${title}</title>
    <script type="application/json" id="static-index">
${JSON.stringify(staticIndex)}
    </script>
</head>
<body>
    ${nav}
    <main>
        ${bodyContent}
    </main>
</body>
</html>`;
}

module.exports = {
    renderHtml,
    renderBlock,
    renderContentNode,
    generateNav,
    generateStaticIndex,
    normalizarBlocks,
    _escapeHtml: escapeHtml
};