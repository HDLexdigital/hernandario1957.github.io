/**
 * @fileoverview src/empaquetador/OpfBuilder.js
 *
 * E14.2 — Generador del Package Document (content.opf) Blindado.
 */

'use strict';

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

/**
 * Escapa caracteres especiales para garantizar XML válido.
 */
function escaparXML(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Construye y valida el archivo content.opf en el staging.
 */
async function construirOPF({
    stagingDir,
    metadata = {},
    manifestItems = [],
    spineIds = []
}) {
    if (!stagingDir || typeof stagingDir !== 'string') {
        throw new TypeError('stagingDir debe ser una ruta válida');
    }

    if (!Array.isArray(manifestItems) || manifestItems.length === 0) {
        throw new Error('E14.2: El manifest no puede estar vacío.');
    }

    if (!Array.isArray(spineIds) || spineIds.length === 0) {
        throw new Error('E14.2: El spine no puede estar vacío.');
    }

    // 1. Validación de IDs duplicados en el manifest
    const idsVistos = new Set();
    for (const item of manifestItems) {
        if (!item.id || !item.href || !item.mediaType) {
            throw new Error(`E14.2: Item del manifest incompleto (id, href, mediaType requeridos).`);
        }
        if (idsVistos.has(item.id)) {
            throw new Error(`E14.2: ID duplicado detectado en el manifest: "${item.id}"`);
        }
        idsVistos.add(item.id);

        // 2. Validación de inventario físico: el archivo debe existir en OEBPS/
        const rutaFisicaRecurso = path.join(stagingDir, 'OEBPS', item.href);
        try {
            const stat = await fs.stat(rutaFisicaRecurso);
            if (!stat.isFile()) {
                throw new Error();
            }
        } catch (e) {
            throw new Error(`E14.2: El recurso declarado en el manifest no existe físicamente en el staging: ${item.href}`);
        }
    }

    // 3. Validación de referencias del spine
    const manifestIdsSet = new Set(manifestItems.map(i => i.id));
    for (const idref of spineIds) {
        if (!manifestIdsSet.has(idref)) {
            throw new Error(`E14.2: El spine referencia un id="${idref}" que no existe en el manifest.`);
        }
    }

    // 4. Metadatos seguros con escape XML y UUID real
    const title = escaparXML(metadata.title || 'Documento LexDigital');
    const language = escaparXML(metadata.language || 'es-CO');
    const identifier = metadata.identifier || `urn:uuid:${crypto.randomUUID()}`;
    const creator = escaparXML(metadata.creator || 'LexDigitalHD');
    const modified = metadata.modified || new Date().toISOString().replace(/\.\d+Z$/, 'Z');

    // 5. Construcción de XML (Soporte dinámico para propiedades especiales como "nav")
    const manifestXml = manifestItems
        .map(item => {
            const propsAttr = item.properties ? ` properties="${escaparXML(item.properties)}"` : '';
            return `    <item id="${escaparXML(item.id)}" href="${escaparXML(item.href)}" media-type="${escaparXML(item.mediaType)}"${propsAttr}/>`;
        })
        .join('\n');

    const spineXml = spineIds
        .map(id => `    <itemref idref="${escaparXML(id)}"/>`)
        .join('\n');

    const opfContent = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="pub-id">${identifier}</dc:identifier>
    <dc:title>${title}</dc:title>
    <dc:language>${language}</dc:language>
    <dc:creator>${creator}</dc:creator>
    <meta property="dcterms:modified">${modified}</meta>
  </metadata>
  <manifest>
${manifestXml}
  </manifest>
  <spine>
${spineXml}
  </spine>
</package>`;

    // 6. Escritura física (estricta observación, cero mutación de otros archivos)
    const opfPath = path.join(stagingDir, 'OEBPS', 'content.opf');
    await fs.writeFile(opfPath, opfContent, { encoding: 'utf8', flag: 'w' });

    return {
        opfPath,
        content: opfContent
    };
}

module.exports = {
    construirOPF
};