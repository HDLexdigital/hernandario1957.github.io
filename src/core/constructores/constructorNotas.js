'use strict';

// Utilidad para escapar caracteres especiales en expresiones regulares
function escaparRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function insertarNotasEnHtml(html, notas) {
    if (!notas || !Array.isArray(notas) || notas.length === 0) {
        return html;
    }

    let htmlModificado = html;

    // 🚀 AISLAMIENTO QUIRÚRGICO: Separar el preámbulo XML y el <head> del <body>
    // Esto evita que modifiquemos accidentalmente la versión XML o los metadatos
    const bodyMatch = htmlModificado.match(/(<body[^>]*>)([\s\S]*?)(<\/body>)/i);
    
    if (!bodyMatch) {
        return html; // Si no hay body, no hacemos reemplazos riesgosos
    }

    const inicioHtml = htmlModificado.substring(0, bodyMatch.index + bodyMatch[1].length);
    let contenidoBody = bodyMatch[2];
    const finHtml = bodyMatch[3] + htmlModificado.substring(bodyMatch.index + bodyMatch[0].length);

    notas.forEach((nota, index) => {
        const llamada = (nota.texto_llamada || String(index + 1)).trim();
        if (!llamada) return;

        const idNota = nota.id || `fn_${index + 1}`;
        const textoNota = nota.texto_nota || '';

        // Crear el enlace de llamada con epub:type y role accesibles
        const enlaceLlamada = `<sup><a href="#${idNota}" id="ref_${idNota}" epub:type="noteref" role="doc-noteref">${llamada}</a></sup>`;

        // 🚀 PROTECCIÓN AVANZADA: 
        // 1. \b asegura que si buscamos "1", no reemplace el "1" de "10" o "Artículo 15".
        // 2. (?![^<]*>) asegura que el reemplazo NO ocurra dentro de una etiqueta HTML (<...>)
        const limitePalabra = /^\w+$/.test(llamada) ? '\\b' : '';
        const regexLlamadaSegura = new RegExp(limitePalabra + escaparRegExp(llamada) + limitePalabra + '(?![^<]*>)');

        // Reemplazar la primera aparición de la llamada estrictamente dentro del body
        contenidoBody = contenidoBody.replace(regexLlamadaSegura, enlaceLlamada);

        // Crear el bloque de nota al pie accesible (<aside>)
        const notaHtml = `
<aside id="${idNota}" epub:type="footnote" role="doc-footnote">
    <p role="doc-footnote-text">${textoNota} <a href="#ref_${idNota}" role="doc-backlink" epub:type="backlink" aria-label="Volver al texto">↩</a></p>
</aside>
`;
        // Acumular la nota al final del documento (justo antes de cerrar el body)
        contenidoBody += notaHtml;
    });

    // Ensamblar el XHTML final
    return inicioHtml + contenidoBody + finHtml;
}

module.exports = { insertarNotasEnHtml };