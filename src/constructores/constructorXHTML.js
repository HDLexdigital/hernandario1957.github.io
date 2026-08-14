/**
 * Constructor XHTML para LexDigitalHD
 * Contrato C.42: Serializador estricto (Dumb Pipe).
 */

'use strict';

function constructorXHTML(nodos) {
    if (!nodos) return '';

    if (!nodos.tipoNodo && Array.isArray(nodos.contenido)) {
        return nodos.contenido
            .map(nodo => renderizarNodo(nodo))
            .join('');
    }

    if (Array.isArray(nodos)) {
        return nodos
            .map(nodo => renderizarNodo(nodo))
            .join('');
    }

    return renderizarNodo(nodos);
}

function renderizarNodo(nodo) {
    if (!nodo || typeof nodo !== 'object') {
        return typeof nodo === 'string' ? escapeHtml(nodo) : '';
    }

    const tag = nodo.resolvedTag || 'p';

    const classAttr =
        nodo.resolvedClass &&
        typeof nodo.resolvedClass === 'string'
            ? nodo.resolvedClass.trim()
            : '';

    let contenidoHtml = '';

    // CORRECCIÓN QUIRÚRGICA: La estructura AST tiene prioridad sobre el texto plano.
    if (Array.isArray(nodo.contenido)) {
        contenidoHtml = nodo.contenido
            .map(hijo => renderizarNodo(hijo))
            .join('');
    } else if (typeof nodo.texto === 'string') {
        contenidoHtml = escapeHtml(nodo.texto);
    }

    const traceAttr =
        typeof nodo.__traceId === 'string' &&
        nodo.__traceId.trim()
            ? ` data-trace="${escapeHtml(nodo.__traceId.trim())}"`
            : '';

    const claseHtml = classAttr
        ? ` class="${escapeHtml(classAttr)}"`
        : '';

    const isInline = [
        'span',
        'a',
        'b',
        'i',
        'em',
        'strong',
        'sup',
        'sub'
    ].includes(tag);

    const sufijo = isInline ? '' : '\n';

    return `<${tag}${traceAttr}${claseHtml}>${contenidoHtml}</${tag}>${sufijo}`;
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

module.exports = { constructorXHTML };