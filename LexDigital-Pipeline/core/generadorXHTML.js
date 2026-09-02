'use strict';
function generarXHTMLCompleto(jsonData, opciones = {}) {
    const contenido = jsonData.contenido || jsonData;
    let bodyContent = '';
    let tocContent = '';
    let contadorTitulos = 0;
    if (Array.isArray(contenido)) {
        for (const elemento of contenido) {
            const texto = elemento.texto || elemento.contenido || '';
            const estilo = (elemento.estilo || elemento.clase || '').toLowerCase();
            if (!texto.trim()) continue;
            // Determinar jerarquía
            let etiqueta = 'p';
            let clase = 'parrafo';
            let role = '';
            if (estilo.includes('title_main') || estilo.includes('titulo_principal')) {
                etiqueta = 'h1';
                clase = 'titulo-principal';
                role = 'role="heading" aria-level="1"';
                contadorTitulos++;
                tocContent += `    <li><a href="#seccion-${contadorTitulos}">${escapeHTML(texto)}</a></li>\n`;
            } else if (estilo.includes('title_chapter') || estilo.includes('titulo_capitulo')) {
                etiqueta = 'h2';
                clase = 'titulo-capitulo';
                role = 'role="heading" aria-level="2"';
                contadorTitulos++;
                tocContent += `    <li><a href="#seccion-${contadorTitulos}">${escapeHTML(texto)}</a></li>\n`;
            } else if (estilo.includes('title') || texto.match(/^TÍTULO|^TITULO|^CAPÍTULO|^CAPITULO/)) {
                etiqueta = 'h2';
                clase = 'titulo';
                role = 'role="heading" aria-level="2"';
                contadorTitulos++;
                tocContent += `    <li><a href="#seccion-${contadorTitulos}">${escapeHTML(texto)}</a></li>\n`;
            } else if (texto.match(/^Artículo\s+\d+/)) {
                etiqueta = 'h3';
                clase = 'articulo';
                role = 'role="heading" aria-level="3"';
            } else if (estilo.includes('terminoglosario') || elemento.glosario) {
                etiqueta = 'span';
                clase = 'termino-glosario';
                role = 'role="term"';
            }
            const idAttr = etiqueta.startsWith('h') ? ` id="seccion-${contadorTitulos}"` : '';
            bodyContent += `  <${etiqueta} class="${clase}"${role}${idAttr}>${escapeHTML(texto)}</${etiqueta}>\n`;
        }
    }
    // Generar TOC si hay títulos
    let tocHTML = '';
    if (tocContent) {
        tocHTML = `  <nav id="toc" role="navigation" aria-label="Tabla de contenido">\n    <h2>Tabla de Contenido</h2>\n    <ul>\n${tocContent}    </ul>\n  </nav>\n\n`;
    }
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="es" xml:lang="es">
<head>
    <meta charset="UTF-8"/>
    <title>${escapeHTML(opciones.titulo || 'Documento')}</title>
    <style>
        body { font-family: Georgia, serif; font-size: 11pt; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { font-size: 18pt; border-bottom: 2px solid #0078d4; padding-bottom: 6px; }
        h2 { font-size: 14pt; color: #333; margin-top: 20px; }
        h3 { font-size: 12pt; color: #555; }
        nav#toc { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        nav#toc ul { list-style: none; padding-left: 0; }
        nav#toc li { margin: 5px 0; }
        .termino-glosario { background: #e8f4fd; padding: 2px 4px; border-radius: 3px; }
    </style>
</head>
<body>
${tocHTML}${bodyContent}
</body>
</html>`;
}
function escapeHTML(texto) {
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
module.exports = { generarXHTMLCompleto };