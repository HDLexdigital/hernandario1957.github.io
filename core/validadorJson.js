/**
 * core/validadorJson.js
 * Convierte formatos de JSON en bruto al estándar requerido por LexDigital.
 */
function normalizarJSON(dataOriginal, nombreArchivo = 'Documento') {
    let tokensArray = [];
    let nombreDoc = nombreArchivo;

    if (Array.isArray(dataOriginal)) {
        tokensArray = dataOriginal;
    } else if (dataOriginal.tokens && Array.isArray(dataOriginal.tokens)) {
        tokensArray = dataOriginal.tokens;
        if (dataOriginal.documento) nombreDoc = dataOriginal.documento;
    } else {
        tokensArray = [dataOriginal];
    }

    const tokensCorregidos = tokensArray.map((token, index) => {
        if (typeof token === 'string') token = { texto_limpio: token };
        const texto = token.texto_limpio || token.texto_completo || token.texto || "";
        return {
            ...token,
            indice: index,
            tipo: token.tipo || "desconocido",
            nivel: typeof token.nivel === 'number' ? token.nivel : 6,
            texto_limpio: texto,
            estilo_indesign: token.estilo_indesign || "estilo-base"
        };
    });

    return {
        documento: nombreDoc,
        fechaExportacion: new Date().toISOString(),
        totalTokens: tokensCorregidos.length,
        tokens: tokensCorregidos
    };
}

module.exports = { normalizarJSON };