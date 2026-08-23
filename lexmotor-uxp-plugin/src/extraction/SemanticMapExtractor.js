/**
 * @fileoverview lexmotor-uxp-plugin/src/extraction/SemanticMapExtractor.js
 * Extractor exclusivo para las reglas de Exportación EPUB/PDF (G3.3.1)
 * Diseñado a partir de evidencia empírica de styleExportTagMaps.
 */

'use strict';

const {
    normalizarColorInDesign,
    normalizarJustificationInDesign
} = require('./InDesignValueNormalizer');

function extraerMapaSemantico(documento) {
    if (!documento || typeof documento !== 'object') {
        throw new TypeError("documento de InDesign inválido");
    }

    const mapa = {
        documentName: documento.name || "Sin Título",
        exportDate: new Date().toISOString(),
        styles: []
    };

    function procesarColeccion(coleccion, tipo) {
        if (!coleccion || typeof coleccion.length !== 'number') return;
        
        const count = coleccion.length;
        for (let i = 0; i < count; i++) {
            const style = typeof coleccion.item === 'function' ? coleccion.item(i) : coleccion[i];
            
            // Ignorar estilos base de InDesign o estilos corruptos
            if (!style || !style.name || style.name.indexOf('[') === 0) continue;

            const styleNode = {
                originalName: style.name,
                type: tipo,
                exportTagging: {},
                presentation: {
                    color: normalizarColorInDesign(style.fillColor),
                    justification: normalizarJustificationInDesign(style.justification)
                }
            };

            const maps = style.styleExportTagMaps;
            if (maps && typeof maps.length === 'number') {
                const mapsCount = maps.length;
                for (let j = 0; j < mapsCount; j++) {
                    const map = typeof maps.item === 'function' ? maps.item(j) : maps[j];
                    if (map && map.exportType) {
                        // Traducimos "EPUB" a "epub" para cumplir el contrato LEDM
                        const tipoExportacion = map.exportType.toLowerCase(); 
                        
                        // Limpiamos strings vacíos transformándolos en null
                        styleNode.exportTagging[tipoExportacion] = {
                            tag: map.exportTag || null,
                            className: map.exportClass || null,
                            attributes: map.exportAttributes || null
                        };
                    }
                }
            }
            
            mapa.styles.push(styleNode);
        }
    }

    // Usamos 'allParagraphStyles' para penetrar carpetas/grupos de estilos
    procesarColeccion(documento.allParagraphStyles, 'paragraph');
    procesarColeccion(documento.allCharacterStyles, 'character');

    return mapa;
}

module.exports = {
    extraerMapaSemantico
};