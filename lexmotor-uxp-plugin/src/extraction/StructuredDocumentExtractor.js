/**
 * @fileoverview lexmotor-uxp-plugin/src/extraction/StructuredDocumentExtractor.js
 * Extractor Estructural - Emisor de Evidencia Cruda (InputPayloadContract v1.2.0)
 * Normaliza y limpia caracteres especiales de InDesign (\r, BOM) y extrae tipografía.
 */

function obtenerElemento(coleccion, indice) {
    if (!coleccion) return null;
    if (typeof coleccion.item === 'function') return coleccion.item(indice);
    return coleccion[indice];
}

function generarCorrelationId() {
    return 'tx-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
}

function extraerDocumentoEstructurado(documento) {
    if (!documento || typeof documento !== 'object') {
        throw new TypeError("[Extractor] Violación Contractual: Documento origen inválido.");
    }

    const nodes = [];
    const stories = documento.stories;

    if (stories && typeof stories.length === 'number') {
        const storiesCount = stories.length;
        
        for (let s = 0; s < storiesCount; s++) {
            const story = obtenerElemento(stories, s);
            if (!story || !story.paragraphs) continue;

            const paragraphsCount = story.paragraphs.length;
            const currentStoryId = String(story.id || s);

            for (let p = 0; p < paragraphsCount; p++) {
                const paragraph = obtenerElemento(story.paragraphs, p);
                if (!paragraph || paragraph.contents === undefined) continue;

                // Limpieza de caracteres de control de InDesign (\r, \uFEFF, \u200B)
                const contenidoLimpio = String(paragraph.contents)
                    .replace(/\r\n|\r/g, '\n')
                    .replace(/[\uFEFF\u200B]/g, '');

                if (contenidoLimpio.trim().length === 0) continue;

                let estiloParrafo = "[Ninguno]";
                if (paragraph.appliedParagraphStyle) {
                    estiloParrafo = paragraph.appliedParagraphStyle.name || "[Ninguno]";
                } else if (paragraph.appliedParagraphStyleName) {
                    estiloParrafo = paragraph.appliedParagraphStyleName;
                }

                // Extracción segura de propiedades tipográficas
                const propiedades = {};
                try {
                    if (paragraph.pointSize) propiedades.pointSize = paragraph.pointSize;
                    if (paragraph.appliedFont && paragraph.appliedFont.name) propiedades.appliedFont = paragraph.appliedFont.name;
                    if (paragraph.fontStyle) propiedades.fontStyle = String(paragraph.fontStyle);
                    if (paragraph.justification) propiedades.justification = String(paragraph.justification);
                } catch (_) {}

                const deterministicId = `story-${currentStoryId}-p-${p}`;

                nodes.push({
                    id: deterministicId,
                    type: "text_node",
                    content: contenidoLimpio,
                    attributes: {
                        styleName: estiloParrafo,
                        storyId: currentStoryId,
                        propiedades: propiedades
                    }
                });
            }
        }
    }

    return {
        contractVersion: "1.2.0",
        correlationId: generarCorrelationId(),
        metadata: {
            source: "Adobe InDesign UXP Plugin",
            pluginVersion: "1.2.0",
            documentName: documento.name || "Sin_Titulo",
            extractionTimestamp: new Date().toISOString()
        },
        document: {
            nodes: nodes
        }
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { extraerDocumentoEstructurado };
}
if (typeof window !== 'undefined') {
    window.extraerDocumentoEstructurado = extraerDocumentoEstructurado;
}
