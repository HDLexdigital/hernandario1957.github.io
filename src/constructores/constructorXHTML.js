'use strict';

function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"']/g, function(m) {
        return {
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[m];
    });
}

function constructorXHTML(ast) {
    if (!ast) return '';

    function renderizarNodo(nodo) {
        if (!nodo || typeof nodo !== 'object') {
            return typeof nodo === 'string' ? escapeHtml(nodo) : '';
        }

        const tag = nodo.resolvedTag || nodo.tag;
        const text = nodo.texto;
        const children = nodo.contenido;

        const hasTag = Boolean(tag);
        const hasText = typeof text === 'string';
        const hasChildren = Array.isArray(children) && children.length > 0;

        if (!hasTag && !hasText && !hasChildren) return '';

        if (!hasTag && hasText && !hasChildren && (!nodo.tipo || nodo.tipo === 'texto' || nodo.tipo === 'character')) {
            return escapeHtml(text);
        }

        let contenidoHtml = '';
        if (hasChildren) {
            contenidoHtml = children.map(renderizarNodo).join('');
        } else if (hasText) {
            contenidoHtml = escapeHtml(text);
        }

        const finalTag = tag || 'p';
        const claseRaw = nodo.resolvedClass || nodo.clase;
        const clase = claseRaw ? ` class="${escapeHtml(claseRaw)}"` : '';

        return `<${finalTag}${clase}>${contenidoHtml}</${finalTag}>`;
    }

    if (Array.isArray(ast)) {
        return ast.map(renderizarNodo).join('\n');
    } else if (ast.documento && Array.isArray(ast.contenido)) {
        return ast.contenido.map(renderizarNodo).join('\n');
    } else if (Array.isArray(ast.contenido) && !ast.resolvedTag && !ast.tag && !ast.tipoNodo && !ast.tipo) {
        return ast.contenido.map(renderizarNodo).join('\n');
    } else {
        return renderizarNodo(ast);
    }
}

// Wrapper de Compatibilidad Histórica para pruebas y sistemas E12.6-A legados.
// Evita contaminar la función constructorXHTML pura.
function renderParagraph(nodo) {
    const { PresentationResolver } = require('../resolucion/PresentationResolver');
    const resolver = new PresentationResolver();

    // 1. Resuelve la presentación explícitamente en modo ESTRICTO (Contrato A6/A7)
    const presClass = resolver.resolve(nodo, true);

    // 2. Propaga la clase doble (Contrato A1-A5)
    const clone = Object.assign({}, nodo);
    const claseSemantica = clone.claseLegal || clone.claseSemantica || '';
    if (presClass) {
        // Ojo al orden invertido que exige el test A1: "texto_cuerpo cuerpo-siguiente"
        clone.resolvedClass = `${claseSemantica} ${presClass}`.trim();
    } else {
        clone.resolvedClass = claseSemantica;
    }
    
    // 3. Simula la inyección estructural del compilador para los tests legados
    clone.resolvedTag = clone.resolvedTag || 'p';
    
    // 4. Delega en el pipeline puro
    return constructorXHTML(clone);
}


module.exports = {
    construirEstructura: constructorXHTML, // Alias hacia la función real
    constructorXHTML                    // Exportación nativa
};