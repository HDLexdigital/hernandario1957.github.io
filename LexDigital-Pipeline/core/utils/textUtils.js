/**
 * utils/textUtils.js
 * Funciones puras para manipulación y limpieza de cadenas de texto.
 */

function escaparHTML(str) {
    if (typeof str !== 'string') return '';
    return str
        // 1. Elimina caracteres de control invisibles de InDesign que rompen el XML
        .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, '')
        // 2. Escapa los caracteres reservados de HTML
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function normalizarClase(nombreEstilo) {
    if (typeof nombreEstilo !== 'string') return 'estilo-desconocido';
    // Sanitización estricta: Solo permite letras, números, guiones y guiones bajos.
    // Esto evita que estilos como [Párrafo "Básico"] rompan la estructura del HTML.
    return nombreEstilo.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/^-+|-+$/g, '');
}

const fs = require('fs');

function leerArchivoTextoSeguro(rutaArchivo) {
    const buffer = fs.readFileSync(rutaArchivo);
    let texto = '';

    // Detección de BOM / Codificación
    if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
        // UTF-16 LE
        texto = buffer.subarray(2).toString('utf16le');
    } else if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
        // UTF-16 BE
        texto = buffer.subarray(2).toString('utf16be');
    } else if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        // UTF-8 BOM
        texto = buffer.subarray(3).toString('utf8');
    } else {
        // UTF-8 estándar
        texto = buffer.toString('utf8');
    }

    // Limpiar BOM residual y caracteres nulos
    return texto.replace(/^\uFEFF/, '').replace(/\0/g, '');
}

module.exports = {
    escaparHTML,
    normalizarClase,
    leerArchivoTextoSeguro
};