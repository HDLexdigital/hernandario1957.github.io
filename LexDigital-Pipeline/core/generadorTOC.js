'use strict';
/**
 * Generador de Tabla de Contenidos (TOC) automática
 * Analiza el contenido y genera navegación
 */
function generarTOC(contenido, opciones = {}) {
    const titulos = [];
    let html = '';
    // Extraer títulos
    if (Array.isArray(contenido)) {
        for (let i = 0; i < contenido.length; i++) {
            const elemento = contenido[i];
            const tipo = (elemento.tipo || '').toLowerCase();
            if (tipo === 'titulo' || tipo === 'h1' || tipo === 'subtitulo' || tipo === 'h2') {
                titulos.push({
                    indice: i,
                    nivel: tipo === 'titulo' || tipo === 'h1' ? 1 : 2,
                    texto: elemento.texto || elemento.contenido || `Sección ${titulos.length + 1}`,
                    id: `seccion-${titulos.length + 1}`
                });
            }
        }
    }
    // Generar HTML del TOC
    if (titulos.length > 0) {
        html += '  <nav id="toc" role="navigation" aria-label="Tabla de contenido">\n';
        html += '    <h2>Tabla de Contenido</h2>\n';
        html += '    <ul>\n';
        for (const titulo of titulos) {
            const indentacion = titulo.nivel === 1 ? '' : '  ';
            html += `${indentacion}      <li><a href="#${titulo.id}">${escapeHTML(titulo.texto)}</a></li>\n`;
        }
        html += '    </ul>\n';
        html += '  </nav>\n\n';
    }
    return {
        html: html,
        titulos: titulos
    };
}
function escapeHTML(texto) {
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
module.exports = { generarTOC };