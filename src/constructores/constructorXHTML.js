/**
 * Constructor XHTML para LexDigitalHD
 */

'use strict';

const { PresentationResolver } = require('../resolucion/PresentationResolver');
const presentationResolver = new PresentationResolver();

function constructorXHTML(nodos) {
    if (!nodos) return '';

    if (Array.isArray(nodos)) {
        return nodos.map(nodo => renderizarNodo(nodo)).join('');
    }

    return renderizarNodo(nodos);
}

function renderizarNodo(nodo) {
    if (!nodo || typeof nodo !== 'object') {
        return typeof nodo === 'string' ? nodo : '';
    }

    const tag = nodo.resolvedTag || 'p';

    // Construcción limpia de la clase final combinando presentación y semántica
    let classAttr = '';

    if (nodo.resolvedClass && typeof nodo.resolvedClass === 'string') {
        classAttr = nodo.resolvedClass.trim();
    } else {
        const presClass = presentationResolver.resolve(nodo) || '';
        const semClass = nodo.claseLegal || nodo.claseSemantica || '';
        classAttr = [presClass, semClass].filter(Boolean).join(' ').trim();
    }

    let contenidoHtml = '';

    if (nodo.texto && typeof nodo.texto === 'string') {
        contenidoHtml = escapeHtml(nodo.texto);
    }

    if (nodo.contenido && Array.isArray(nodo.contenido)) {
        contenidoHtml = nodo.contenido.map(hijo => renderizarNodo(hijo)).join('');
    }

    // Soporte robusto y transparente de trazabilidad efímera (C.17.8)
    const traceAttr =
        typeof nodo.__traceId === 'string' && nodo.__traceId.trim()
            ? ` data-trace="${escapeHtml(nodo.__traceId.trim())}"`
            : '';

    if (!classAttr) {
        return `<${tag}${traceAttr}>${contenidoHtml}</${tag}>\n`;
    }

    return `<${tag}${traceAttr} class="${escapeHtml(classAttr)}">${contenidoHtml}</${tag}>\n`;
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