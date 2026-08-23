/**
 * E18.2.5.3-A — StructuralAnchorExtractor
 * 
 * Extractor forense pasivo de anclajes estructurales normativos.
 * Identifica hitos como artículos dentro de un documento canónico de forma intradiádica,
 * normalizando claves y preservando intacto el texto original.
 */

'use strict';

class StructuralAnchorExtractor {
    /**
     * Extrae los anclajes estructurales normativos de un documento canónico.
     * @param {Object} doc - ASTCanonicalDocument o DOMCanonicalDocument (solo lectura)
     * @returns {Object} Mapa de anclajes inmutable
     */
    static extract(doc) {
        const nodes = doc.nodes || [];
        const source = doc.source || 'AST';
        const anchors = [];

        // Expresión regular robusta para detectar encabezados normativos (ej: Artículo 72., ARTICULO 15.-, Art. 22A)
        // Evita falsos positivos midiendo la posición inicial del patrón (debe estar al comienzo del texto limpio de espacios)
        const regexArticulo = /^(?:art[íi]culo|art\.)\s+([0-9]+[a-zA-Z]*)/i;

        nodes.forEach((node) => {
            const text = (node.normalizedText || '').trim();
            const match = text.match(regexArticulo);

            if (match) {
                const key = match[1];
                anchors.push({
                    type: 'ARTICLE',
                    key: key,
                    index: node.index !== undefined ? node.index : nodes.indexOf(node),
                    rawText: node.normalizedText
                });
            }
        });

        return {
            version: '1.0.0',
            source,
            anchors
        };
    }
}

module.exports = StructuralAnchorExtractor;