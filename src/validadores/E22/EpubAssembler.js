/**
 * E22.5.3 — EpubAssembler (Ensamblador de Contenedores EPUB 3)
 * 
 * - Genera el contenido XML válido para META-INF/container.xml apuntando al OPF.
 * - Genera el contenido estricto de la cadena `mimetype` sin espacios ni saltos de línea.
 * - Valida la integridad de las rutas de entrada.
 */

'use strict';

class EpubAssembler {
    /**
     * Genera el contenido XML del contenedor EPUB (container.xml).
     * @param {string} opfPath - Ruta relativa dentro del contenedor hacia el archivo package.opf.
     * @returns {string} XML formateado de container.xml.
     */
    static generateContainerXML(opfPath) {
        if (!opfPath || typeof opfPath !== 'string' || opfPath.trim() === '') {
            throw new Error('CONTAINER_PATH_VIOLATION: Se requiere una ruta de OPF válida para generar el container.xml.');
        }

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">\n';
        xml += '  <rootfiles>\n';
        xml += `    <rootfile full-path="${opfPath.trim()}" media-type="application/oebps-package+xml"/>\n`;
        xml += '  </rootfiles>\n';
        xml += '</container>';

        return xml;
    }

    /**
     * Retorna la cadena de texto estricta para el archivo mimetype de EPUB 3.
     * @returns {string} application/epub+zip
     */
    static generateMimetype() {
        return 'application/epub+zip';
    }
}

module.exports = EpubAssembler;