/**
 * E22.5.2 — EpubNavGenerator (Generador de Tabla de Contenido accesible nav.xhtml)
 * 
 * - Genera el documento XHTML para la navegación semántica exigida por EPUB 3.
 * - Incluye el landmark obligatorio <nav epub:type="toc" id="toc">.
 * - Valida que la lista de elementos (TOC items) no esté vacía.
 * - Respeta inmutabilidad y emite XHTML estructurado accesible.
 */

'use strict';

class EpubNavGenerator {
    /**
     * Genera el contenido XHTML del documento de navegación (nav.xhtml).
     * @param {Array<Object>} tocItems - Lista de elementos con id, label y href.
     * @returns {string} Código XHTML formateado de navegación.
     */
    static generateNav(tocItems) {
        if (!Array.isArray(tocItems) || tocItems.length === 0) {
            throw new Error('EPUB_NAV_VIOLATION: Se requiere una lista de elementos (tocItems) válida y no vacía para la navegación.');
        }

        let html = '<?xml version="1.0" encoding="UTF-8"?>\n';
        html += '<!DOCTYPE html>\n';
        html += '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="es">\n';
        html += '<head>\n';
        html += '  <meta charset="UTF-8" />\n';
        html += '  <title>Tabla de Contenido</title>\n';
        html += '</head>\n';
        html += '<body>\n';
        html += '  <nav epub:type="toc" id="toc">\n';
        html += '    <h2>Índice General</h2>\n';
        html += '    <ol>\n';

        tocItems.forEach(item => {
            const escapedLabel = this._escapeHtml(item.label || item.id);
            const escapedHref = this._escapeHtml(item.href);
            html += `      <li><a href="${escapedHref}">${escapedLabel}</a></li>\n`;
        });

        html += '    </ol>\n';
        html += '  </nav>\n';
        html += '</body>\n';
        html += '</html>';

        return html;
    }

    /**
     * Escapa caracteres especiales para garantizar XML/XHTML válido.
     * @private
     */
    static _escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
}

module.exports = EpubNavGenerator;