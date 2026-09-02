'use strict';

function constructorXHTML(documento, opciones = {}) {
    const { titulo = 'Documento', idioma = 'es-CO', cssPath = 'assets/lexcodex.css' } = opciones;
    
    let xhtml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xhtml += '<!DOCTYPE html>\n';
    
    // 🚀 DECLARACIÓN DEL NAMESPACE EPUB: Evita el error "prefix epub is not defined"
    xhtml += '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="' + escapeHTML(idioma) + '" lang="' + escapeHTML(idioma) + '">\n';
    
    xhtml += '<head>\n';
    xhtml += '  <meta charset="UTF-8" />\n';
    xhtml += '  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.5, user-scalable=yes" />\n';
    xhtml += '  <title>' + escapeHTML(titulo) + '</title>\n';
    if (cssPath) {
        xhtml += '  <link rel="stylesheet" href="' + escapeHTML(cssPath) + '" />\n';
    }
    xhtml += '</head>\n';
    xhtml += '<body role="document">\n';

    // Soportar múltiples estructuras de entrada (AST crudo o adaptado)
    const nodos = documento.contenido || documento.parrafos || (Array.isArray(documento) ? documento : []);
    
    for (const elemento of nodos) {
        xhtml += procesarElementoConFragmentos(elemento);
    }
    
    xhtml += '</body>\n';
    xhtml += '</html>';
    return xhtml;
}

// Alias compatible por si compilar.js importa construirEstructura
function construirEstructura(parrafos, metadatos = {}, cssPath = 'assets/lexcodex.css', extra = '') {
    return constructorXHTML({ contenido: parrafos }, {
        titulo: metadatos.titulo || 'Documento Legal',
        idioma: metadatos.idioma || 'es-CO',
        cssPath: cssPath
    });
}

function procesarElementoConFragmentos(elemento) {
    if (!elemento) return '';

    const estilo = elemento.inDesignStyle || elemento.estilo || elemento.claseLegal || 'P01_BODY_BASE';
    const claseExacta = String(estilo).replace(/\s+/g, '_').toLowerCase().replace(/[^a-z0-9_-]/g, '');
    
    const idAttr = elemento.id ? ' id="' + escapeHTML(elemento.id) + '"' : '';

    // Determinar etiqueta HTML semántica
    let etiqueta = 'p';
    const estUpper = String(estilo).toUpperCase();
    if (estUpper.includes('TITLE_MAIN') || estUpper.includes('TITLE_PART')) etiqueta = 'h1';
    else if (estUpper.includes('TITLE_CHAPTER')) etiqueta = 'h2';
    else if (estUpper.includes('TITLE')) etiqueta = 'h3';

    // Procesar contenido interno (Fragmentos con estilos de carácter o texto plano)
    let contenidoHtml = '';
    const fragmentos = elemento.fragmentos || elemento.contenido;

    if (fragmentos && Array.isArray(fragmentos) && fragmentos.length > 0) {
        contenidoHtml = fragmentos.map(frag => {
            let texto = escapeHTML(frag.texto || '');
            if (!texto) return '';
            texto = texto.replace(/\r$/, ''); // Limpiar retorno de carro de InDesign

            // Formato directo (Negrita / Cursiva manual)
            if (frag.formatoDirecto) {
                if (frag.formatoDirecto.negrita) texto = '<strong>' + texto + '</strong>';
                if (frag.formatoDirecto.cursiva) texto = '<em>' + texto + '</em>';
            }

            // Estilo de carácter formal (Ej: C18_TT_GLOSS)
            const estiloChar = frag.estiloCaracter;
            if (estiloChar && estiloChar !== '[Ninguno]' && estiloChar !== '') {
                const claseChar = String(estiloChar)
                    .toLowerCase()
                    .replace(/[\s\_]+/g, '-')
                    .replace(/[^a-z0-9_-]/g, '');
                return '<span class="' + claseChar + '">' + texto + '</span>';
            }

            return texto;
        }).join('');
    } else {
        // Fallback si no hay fragmentos estructurados
        contenidoHtml = escapeHTML(String(elemento.texto || ''));
    }

    return '  <' + etiqueta + idAttr + ' class="' + claseExacta + '">' + contenidoHtml + '</' + etiqueta + '>\n';
}

function escapeHTML(texto) {
    if (!texto) return '';
    return String(texto)
        // 🚀 FILTRO SANITARIO XML: Elimina los caracteres de control invisibles de InDesign
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // 🚀 ESCAPADO ESTÁNDAR HTML
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

module.exports = { 
    constructorXHTML,
    construirEstructura 
};