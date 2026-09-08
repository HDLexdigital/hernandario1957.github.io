'use strict';
function validarDocumentoEntrada(jsonData) {
    const errores = [];
    if (!jsonData || typeof jsonData !== 'object') {
        return { valido: false, errores: ['Documento vacío o inválido'] };
    }
    const contenido = jsonData.contenido || (jsonData.documento && jsonData.documento.contenido);
    if (!contenido) errores.push('Falta contenido');
    else if (Array.isArray(contenido) && contenido.length === 0) errores.push('Contenido vacío');
    return { valido: errores.length === 0, errores };
}
module.exports = { validarDocumentoEntrada };