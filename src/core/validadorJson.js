function validarEntrada(jsonCrudo) {
    if (
        jsonCrudo === null ||
        typeof jsonCrudo !== 'object' ||
        Array.isArray(jsonCrudo)
    ) {
        throw new TypeError(
            `jsonCrudo debe ser un objeto, se recibió: ${
                jsonCrudo === null ? 'null' : typeof jsonCrudo
            }`
        );
    }
}

function normalizarJSON(jsonCrudo, nombreBase) {
    validarEntrada(jsonCrudo);

    const documento = jsonCrudo.documento;
    const contenido = jsonCrudo.contenido;

    const tokens = contenido.map((item, index) => ({
        ...item,
        id: item.id ?? index
        // <-- ¡Adiós texto_completo!
    }));

    return {
        documento,
        tokens
    };
}

module.exports = {
    validarEntrada,
    normalizarJSON
};