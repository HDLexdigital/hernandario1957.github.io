/**
 * @fileoverview lexmotor-uxp-plugin/src/extraction/StructuredDocumentExtractor.js
 * Extractor estructural polimórfico (G3.2.1)
 * Compatible tanto con colecciones nativas de InDesign UXP (.item()) como con mocks de Jest ([]).
 */

function obtenerElemento(coleccion, indice) {
    if (!coleccion) return null;
    if (typeof coleccion.item === 'function') {
        return coleccion.item(indice);
    }
    return coleccion[indice];
}

function extraerDocumentoEstructurado(documento) {
    if (!documento || typeof documento !== 'object') {
        throw new TypeError("documento de InDesign inválido");
    }

    const resultado = {
        documento: {
            titulo: documento.name || "Sin Título"
        },
        fragmentos: []
    };

    const stories = documento.stories;
    if (!stories || typeof stories.length !== 'number') {
        return resultado;
    }

    const storiesCount = stories.length;
    for (let s = 0; s < storiesCount; s++) {
        const story = obtenerElemento(stories, s);
        if (!story || !story.paragraphs || typeof story.paragraphs.length !== 'number') continue;

        const paragraphs = story.paragraphs;
        const paragraphsCount = paragraphs.length;

        for (let p = 0; p < paragraphsCount; p++) {
            const paragraph = obtenerElemento(paragraphs, p);
            if (!paragraph) continue;

            const fragmentos = [];
            const ranges = paragraph.textStyleRanges;

            if (ranges && typeof ranges.length === 'number') {
                const rangesCount = ranges.length;
                for (let r = 0; r < rangesCount; r++) {
                    const range = obtenerElemento(ranges, r);
                    if (range) {
                        const estiloCar = (range.appliedCharacterStyle && range.appliedCharacterStyle.name) 
                            ? range.appliedCharacterStyle.name 
                            : (range.appliedCharacterStyleName || "[Ninguno]");

                        fragmentos.push({
                            texto: range.contents || "",
                            estiloCaracter: estiloCar
                        });
                    }
                }
            }

            let estiloParrafo = "[Ninguno]";
            try {
                if (paragraph.appliedParagraphStyle && paragraph.appliedParagraphStyle.name) {
                    estiloParrafo = paragraph.appliedParagraphStyle.name;
                } else if (paragraph.appliedParagraphStyleName) {
                    estiloParrafo = paragraph.appliedParagraphStyleName;
                }
            } catch (e) {}

            // AÑADIDO: Extracción del texto crudo a nivel de párrafo para el contrato LEDM
            resultado.fragmentos.push({
                estilo: estiloParrafo,
                texto: paragraph.contents || "",
                fragmentos
            });
        }
    }

    return resultado;
}

module.exports = {
    extraerDocumentoEstructurado
};