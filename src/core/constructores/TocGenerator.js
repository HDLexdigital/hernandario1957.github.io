'use strict';

// ============================================================================
// UTILIDADES INTEGRADAS (Para evitar errores de MODULE_NOT_FOUND)
// ============================================================================
function escaparHTML(texto) {
    if (!texto) return '';
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// 🚀 REPLICA DE SLUGIFY: Permite deducir el nombre real del archivo sin modificar compilar.js
function slugify(texto) {
    return String(texto)
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9_-]+/g, '_')
        .replace(/_+/g, '_');
}
// ============================================================================

class TocGenerator {
    /**
     * Extrae los encabezados del AST y les asigna un ID único.
     * @param {Array} parrafos - El AST ya clasificado por el motor GREP.
     * @returns {Array} Lista de nodos que forman la tabla de contenido.
     */
    static extraerEstructura(parrafos) {
        const toc = [];
        let idCounter = 1;

        parrafos.forEach(parr => {
            // Filtramos solo los elementos que el GREP marcó como niveles jerárquicos (1 al 4)
            if (parr.nivelHtml && parr.nivelHtml <= 4) {
                // Le inyectamos un ID seguro al párrafo en el AST para que el constructorXHTML lo imprima luego
                parr.id = `nodo-nav-${idCounter++}`; 
                
                toc.push({
                    id: parr.id,
                    nivel: parr.nivelHtml,
                    texto: parr.textoPlano || parr.texto || 'Sin título',
                    epubType: parr.epubType
                });
            }
        });

        return toc;
    }

    /**
     * Construye el archivo toc.xhtml estándar de EPUB3.
     */
    static construirTocXhtml(tocItems, tituloDocumento = "Índice General") {
        // 🚀 ENLACES DINÁMICOS: Detectamos el nombre exacto de los archivos generados
        const nombreBaseSeguro = slugify(tituloDocumento) || 'documento';
        const archivoXhtml = `${nombreBaseSeguro}.xhtml`;
        const archivoCss = `${nombreBaseSeguro}.css`;

        // 🚀 PREÁMBULO XML: Obligatorio para que el TOC pase la validación EPUBCheck
        let xhtml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xhtml += `<!DOCTYPE html>\n`;
        xhtml += `<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="es" lang="es">\n`;
        xhtml += `<head>\n`;
        xhtml += `    <meta charset="utf-8" />\n`;
        xhtml += `    <title>${escaparHTML(tituloDocumento)}</title>\n`;
        xhtml += `    <link rel="stylesheet" href="${archivoCss}" type="text/css" />\n`;
        xhtml += `</head>\n`;
        xhtml += `<body epub:type="frontmatter">\n`;
        xhtml += `    <nav epub:type="toc" id="toc" role="doc-toc">\n`;
        xhtml += `        <h1>${escaparHTML(tituloDocumento)}</h1>\n`;
        xhtml += `        <ol>\n`;

        let nivelActual = 1;

        tocItems.forEach(item => {
            // Manejo de indentación/anidamiento de listas <ol> según el nivel
            if (item.nivel > nivelActual) {
                xhtml += `\n${'  '.repeat(item.nivel)}<ol>\n`;
                nivelActual = item.nivel;
            } else if (item.nivel < nivelActual) {
                while (nivelActual > item.nivel) {
                    xhtml += `${'  '.repeat(nivelActual)}</ol></li>\n`;
                    nivelActual--;
                }
            } else {
                // Si estamos en el mismo nivel y no es el primer elemento, cerramos el <li> anterior
                if (item.id !== tocItems[0].id) {
                    xhtml += `</li>\n`;
                }
            }

            const textoLimpio = escaparHTML(item.texto);
            // 🚀 CORRECCIÓN CRÍTICA: Se inyecta la variable dinámica archivoXhtml en lugar del texto fijo
            xhtml += `${'  '.repeat(item.nivel + 2)}<li><a href="${archivoXhtml}#${item.id}">${textoLimpio}</a>`;
        });

        // Cerrar etiquetas abiertas
        while (nivelActual > 1) {
            xhtml += `${'  '.repeat(nivelActual)}</li>\n${'  '.repeat(nivelActual)}</ol>\n`;
            nivelActual--;
        }
        xhtml += `        </li>\n        </ol>\n    </nav>\n</body>\n</html>`;

        return xhtml;
    }
}

module.exports = TocGenerator;