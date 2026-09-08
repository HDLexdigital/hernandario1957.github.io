/**
 * Adaptador para transformar el JSON editorial de InDesign al formato LEDM normalizado.
 * @param {Object} jsonEditorial - Objeto JSON crudo proveniente de la extracción del DOM.
 * @returns {Object} - Documento estructurado bajo el estándar LEDM para el core.
 */
function jsonEditorialAdapter(jsonEditorial) {
    const tituloDoc = jsonEditorial.documento?.titulo || "Documento Legal";
    const nodosEntrada = jsonEditorial.contenido || [];

    const contenidoNormalizado = nodosEntrada.map((nodo, index) => {
        let tipoSemantico = "texto_cuerpo";
        let numeroArticulo = null;

        // 1. Detección semántica basada en el texto (Patrón de Artículos Legales)
        const matchArticulo = nodo.texto.match(/^Artículo\s+(\d+)\./i);
        if (matchArticulo) {
            tipoSemantico = "articulo";
            numeroArticulo = parseInt(matchArticulo[1], 10);
        } 
        // 2. Detección basada en el estilo tipográfico original de InDesign
        else if (nodo.tipo === "P02_TITLE_PART" || nodo.tipo === "P02_TITLE_MAIN") {
            tipoSemantico = "titulo";
        } else if (nodo.tipo === "P03_CENTER_BOLD") {
            tipoSemantico = "encabezado";
        }

        // Estructura de salida LEDM estricta requerida por el Core
        return {
            id: index,
            estiloOriginal: nodo.tipo,
            tipo: tipoSemantico,
            ...(numeroArticulo !== null && { numero: numeroArticulo }),
            texto: nodo.texto
        };
    });

    return {
        documento: {
            titulo: tituloDoc,
            totalNodos: contenidoNormalizado.length
        },
        contenido: contenidoNormalizado
    };
}

module.exports = { jsonEditorialAdapter };