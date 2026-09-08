/**
 * src/utils/cssPurifier.js
 * Módulo encargado de limpiar y sanear estilos de InDesign.
 */

function purgarCSSInDesign(cssCrudo) {
    if (typeof cssCrudo !== 'string' || cssCrudo.trim() === '') {
        return '';
    }

    let cssLimpio = cssCrudo;

    // Saneamiento de colores de InDesign
    cssLimpio = cssLimpio.replace(/color:\s*\/\*[\s\S]*?\*\/;/gi, 'color: #1a1a1a;');

    // Saneamiento de fuentes 'undefined'
    cssLimpio = cssLimpio.replace(/font-family:\s*['"]undefined['"]\s*,\s*sans-serif;/gi, 'font-family: \'Liberation Serif\', serif;');

    // Corrección de selectores especiales
    cssLimpio = cssLimpio.replace(/\.05-Hiperlink_char/g, '.C05_HIPERLINK_CHAR');
    cssLimpio = cssLimpio.replace(/\.P-rrafo-b-sico/g, '.P01_PARRAFO_BASICO');

    return cssLimpio;
}

// ¡CRUCIAL! Exportación correcta para que Node.js la reconozca
module.exports = { purgarCSSInDesign };