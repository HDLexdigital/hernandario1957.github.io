/**
 * core/jsonEditorialAdapter.js
 * Adaptador para transformar el JSON editorial de InDesign al formato canónico validado.
 * Cumple estrictamente con el vocabulario controlado de ContentSchemaValidator.
 * 
 * @param {Object} jsonEditorial - Objeto JSON crudo proveniente de la extracción del DOM o UXP.
 * @returns {Object} - Documento estructurado bajo el estándar normativo del Pipeline.
 */
function jsonEditorialAdapter(jsonEditorial) {
    if (!jsonEditorial || typeof jsonEditorial !== 'object') {
        return {
            documento: { titulo: "Documento Legal", totalNodos: 0 },
            contenido: []
        };
    }

    let tituloDoc = "Documento Legal";
    if (jsonEditorial.documento) {
        if (typeof jsonEditorial.documento === 'string') {
            tituloDoc = jsonEditorial.documento;
        } else if (jsonEditorial.documento.titulo) {
            tituloDoc = jsonEditorial.documento.titulo;
        }
    } else if (jsonEditorial.titulo) {
        tituloDoc = jsonEditorial.titulo;
    } else if (jsonEditorial.metadata && jsonEditorial.metadata.documentName) {
        tituloDoc = jsonEditorial.metadata.documentName;
    } else if (Array.isArray(jsonEditorial.tokens) && jsonEditorial.tokens[0] && jsonEditorial.tokens[0].documento) {
        tituloDoc = jsonEditorial.tokens[0].documento;
    }

    // Extraer colección de nodos desde cualquier formato de origen (UXP, InDesign raw, tokens, fragmentos)
    let nodosEntrada = [];
    if (Array.isArray(jsonEditorial.contenido)) {
        nodosEntrada = jsonEditorial.contenido;
    } else if (Array.isArray(jsonEditorial.fragmentos)) {
        nodosEntrada = jsonEditorial.fragmentos;
    } else if (jsonEditorial.document && Array.isArray(jsonEditorial.document.nodes)) {
        nodosEntrada = jsonEditorial.document.nodes;
    } else if (Array.isArray(jsonEditorial.tokens) && jsonEditorial.tokens[0] && Array.isArray(jsonEditorial.tokens[0].contenido)) {
        nodosEntrada = jsonEditorial.tokens[0].contenido;
    } else if (Array.isArray(jsonEditorial.elementos)) {
        nodosEntrada = jsonEditorial.elementos;
    } else if (jsonEditorial.documento && Array.isArray(jsonEditorial.documento.cuerpo_ley)) {
        nodosEntrada = [];
        for (const bloque of jsonEditorial.documento.cuerpo_ley) {
            if (Array.isArray(bloque.elementos)) {
                nodosEntrada.push(...bloque.elementos);
            }
        }
    }

    const contenidoNormalizado = nodosEntrada.map((nodo, index) => {
        const textoOriginal = String(nodo.texto || nodo.content || nodo.texto_completo || nodo.contenido || '')
            .replace(/\r\n|\r/g, '\n')
            .replace(/[\uFEFF\u200B]/g, '')
            .trim();
        const estiloOriginal = String(nodo.tipo || nodo.estilo || (nodo.attributes && nodo.attributes.styleName) || nodo.inDesignStyle || '').trim();
        const estiloUpper = estiloOriginal.toUpperCase();
        let tipoSemantico = "texto_cuerpo";
        let numeroArticulo = null;

        // 1. Detección semántica basada en el texto (Patrón de Artículos Legales)
        const matchArticulo = textoOriginal.match(/^Artículo\s+(\d+)\./i);
        const matchParagrafo = textoOriginal.match(/^Parágrafo/i);
        const matchCapitulo = textoOriginal.match(/^CAPÍTULO\s+[IVXLCDM]+/i);
        const matchTitulo = textoOriginal.match(/^TÍTULO\s+[IVXLCDM]+/i);

        if (matchArticulo) {
            tipoSemantico = "articulo";
            numeroArticulo = parseInt(matchArticulo[1], 10);
        } else if (matchParagrafo) {
            tipoSemantico = "paragrafo_normativo";
        } else if (matchCapitulo) {
            tipoSemantico = "capitulo";
        } else if (matchTitulo) {
            tipoSemantico = "titulo_parte";
        }
        // 2. Detección basada en el estilo tipográfico original de InDesign
        else if (estiloUpper === "P02_TITLE_PART" || estiloUpper === "P02_TITLE_MAIN" || estiloUpper === "TITULO") {
            tipoSemantico = "titulo_parte";
        } else if (estiloUpper === "P02_TITLE_CHAPTER" || estiloUpper === "CAPITULO") {
            tipoSemantico = "capitulo";
        } else if (estiloUpper === "P03_CENTER_BOLD") {
            tipoSemantico = "seccion";
        } else if (estiloUpper === "P07_INDENT_L1") {
            tipoSemantico = "inciso";
        } else if (estiloUpper === "P01_BODY_BASE" || estiloUpper === "P01_BODY_CONT" || estiloUpper === "BODY-TEXT") {
            tipoSemantico = "parrafo";
        }

        return {
            id: nodo.id ?? index + 1,
            estiloOriginal: estiloOriginal || "P01_BODY_BASE",
            tipo: tipoSemantico,
            ...(numeroArticulo !== null && { numero: numeroArticulo }),
            propiedades: nodo.propiedades || nodo.propiedadesEstilo || (nodo.attributes && nodo.attributes.propiedades) || {},
            texto: textoOriginal || "Texto"
        };
    }).filter(n => n.texto.trim().length > 0);


    return {
        documento: {
            titulo: String(tituloDoc).trim() || "Documento Legal",
            totalNodos: contenidoNormalizado.length
        },
        contenido: contenidoNormalizado
    };
}

module.exports = { jsonEditorialAdapter };