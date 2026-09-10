'use strict';

function escaparHTML(texto) {
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function construirParrafo(nodo) {
    const clase = nodo.class || '';
    const role = nodo.role ? ` role="${nodo.role}"` : '';
    const aria = nodo['aria-label'] ? ` aria-label="${nodo['aria-label']}"` : '';
    const texto = nodo.text ? escaparHTML(nodo.text) : (nodo.html || '');
    return `<p class="${clase}"${role}${aria}>${texto}</p>`;
}

function construirSeccion(nodo) {
    const id = nodo.id ? ` id="${nodo.id}"` : '';
    const titulo = nodo.title ? `<h2>${escaparHTML(nodo.title)}</h2>` : '';
    const hijos = (nodo.children || []).map(construirNodo).join('\n');
    return `<section${id}>\n${titulo}\n${hijos}\n</section>`;
}

function construirArticulo(nodo) {
    const id = nodo.id ? ` id="${nodo.id}"` : '';
    const titulo = nodo.title ? `<h3>${escaparHTML(nodo.title)}</h3>` : '';
    const parrafos = (nodo.paragraphs || []).map(construirParrafo).join('\n');
    return `<article${id}>\n${titulo}\n${parrafos}\n</article>`;
}

function construirNodo(nodo) {
    switch (nodo.type) {
        case 'section': return construirSeccion(nodo);
        case 'article': return construirArticulo(nodo);
        case 'p': return construirParrafo(nodo);
        case 'html': return nodo.html || '';
        default: return '';
    }
}

function construirXHTMLDesdeLEDM(ledm) {
    const documentTitle = (ledm.meta && ledm.meta.title) ? ledm.meta.title : 'Documento LexDigitalHD';
    const nodos = ledm.content || ledm.nodes || [];
    const cuerpo = nodos.map(construirNodo).join('\n');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escaparHTML(documentTitle)}</title>
</head>
<body>
${cuerpo}
</body>
</html>`;
}

module.exports = { construirXHTMLDesdeLEDM, escaparHTML };
