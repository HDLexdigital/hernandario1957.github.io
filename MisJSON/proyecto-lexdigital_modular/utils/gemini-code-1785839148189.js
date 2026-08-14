/**
 * utils/textUtils.js
 * Funciones puras para manipulación y limpieza de cadenas de texto.
 */

function escaparHTML(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function normalizarClase(nombreEstilo) {
    if (typeof nombreEstilo !== 'string') return 'estilo-desconocido';
    // Mantiene el nombre exacto del estilo de InDesign (ej. P01_BODY_BASE)
    return nombreEstilo.trim().replace(/\s+/g, '-'); 
}

// Exportamos las funciones para que otros archivos puedan usarlas
module.exports = {
    escaparHTML,
    normalizarClase
};