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

module.exports = {
    escaparHTML,
    normalizarClase
};