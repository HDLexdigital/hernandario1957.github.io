'use strict';

const fs = require('fs');

/**
 * Limpia el Byte Order Mark (BOM) UTF-8 de una cadena de texto si está presente.
 * @param {string} contenido - El texto de entrada que puede contener un BOM.
 * @returns {string} El texto limpio sin BOM.
 */
function limpiarBOM(contenido) {
    if (typeof contenido === 'string' && contenido.charCodeAt(0) === 0xFEFF) {
        return contenido.slice(1);
    }
    return contenido;
}

/**
 * Lee un archivo de texto garantizando la limpieza de codificación UTF-8 sin BOM.
 * @param {string} ruta - Ruta absoluta o relativa del archivo.
 * @returns {string} Contenido del archivo limpio.
 */
function leerArchivoUTF8(ruta) {
    const contenidoCrudo = fs.readFileSync(ruta, 'utf8');
    return limpiarBOM(contenidoCrudo);
}

module.exports = {
    limpiarBOM,
    leerArchivoUTF8
};
