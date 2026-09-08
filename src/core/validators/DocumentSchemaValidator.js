/**
 * @fileoverview src/core/validators/DocumentSchemaValidator.js
 * Validador de esquema estructural para documentos jurídicos (PIPE-CONTRACT-002).
 */

function validarDocumento(jsonCrudo) {

    if (!jsonCrudo.documento) {
        throw new TypeError(
            'falta propiedad requerida "documento"'
        );
    }


    if (
        typeof jsonCrudo.documento !== 'object' ||
        jsonCrudo.documento === null
    ) {
        throw new TypeError(
            '"documento" debe ser un objeto válido'
        );
    }


    // PIPE-CONTRACT-002-C
    // La propiedad debe existir
    if (!Object.prototype.hasOwnProperty.call(
        jsonCrudo.documento,
        'titulo'
    )) {
        throw new TypeError(
            'falta propiedad requerida "titulo" en el documento'
        );
    }


    // PIPE-CONTRACT-002-D
    // La propiedad existe pero es inválida
    if (
        typeof jsonCrudo.documento.titulo !== 'string' ||
        jsonCrudo.documento.titulo.trim() === ''
    ) {
        throw new TypeError(
            'el título del documento no puede estar vacío'
        );
    }


    return true;
}


module.exports = {
    validarDocumento
};