/**
 * E22.5.2 — EpubManifestGenerator (Generador de Metadatos OPF para EPUB 3)
 * 
 * - Genera el contenido XML del archivo package.opf cumpliendo el estándar EPUB 3.
 * - Valida obligatoriedad de metadatos (title, language, identifier) lanzando EPUB_METADATA_VIOLATION.
 * - Vincula package@unique-identifier con el id del dc:identifier ("pub-id").
 * - Ensambla con orden determinista las secciones <metadata>, <manifest> y <spine>.
 * - Respeta la inmutabilidad de los objetos de entrada.
 */

'use strict';

class EpubManifestGenerator {
    /**
     * Genera el XML del archivo package.opf para EPUB 3.
     * @param {Object} metadata - Objeto con title, language, identifier y opcionalmente creator.
     * @param {Array<Object>} files - Lista de archivos a registrar en el manifest y spine.
     * @returns {string} XML formateado del paquete OPF.
     */
    static generateOPF(metadata, files) {
        if (!metadata || !metadata.title || !metadata.language || !metadata.identifier) {
            throw new Error('EPUB_METADATA_VIOLATION: Faltan metadatos obligatorios (title, language, identifier).');
        }

        const uniqueId = 'pub-id';

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += `<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="${uniqueId}">\n`;

        // 1. Metadata (Dublin Core)
        xml += `  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">\n`;
        xml += `    <dc:title>${this._escapeXml(metadata.title)}</dc:title>\n`;
        xml += `    <dc:language>${this._escapeXml(metadata.language)}</dc:language>\n`;
        xml += `    <dc:identifier id="${uniqueId}">${this._escapeXml(metadata.identifier)}</dc:identifier>\n`;
        
        if (metadata.creator) {
            xml += `    <dc:creator>${this._escapeXml(metadata.creator)}</dc:creator>\n`;
        }
        xml += `  </metadata>\n`;

        // 2. Manifest
        xml += `  <manifest>\n`;
        if (Array.isArray(files)) {
            files.forEach(file => {
                let itemTag = `    <item id="${file.id}" href="${file.href}" media-type="${file.mediaType}"`;
                if (file.properties) {
                    itemTag += ` properties="${file.properties}"`;
                }
                itemTag += '/>\n';
                xml += itemTag;
            });
        }
        xml += `  </manifest>\n`;

        // 3. Spine
        xml += `  <spine>\n`;
        if (Array.isArray(files)) {
            files.forEach(file => {
                // Solo los recursos XHTML de contenido principal forman parte lineal del spine principal
                if (file.mediaType === 'application/xhtml+xml' && file.properties !== 'nav') {
                    xml += `    <itemref idref="${file.id}"/>\n`;
                }
            });
        }
        xml += `  </spine>\n`;

        xml += `</package>`;

        return xml;
    }

    /**
     * Escapa caracteres especiales para garantizar XML válido.
     * @private
     */
    static _escapeXml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
}

module.exports = EpubManifestGenerator;