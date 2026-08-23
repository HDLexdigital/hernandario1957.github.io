/**
 * utils/cssPurifier.js
 * Utilidad experta para revisar, depurar y rectificar hojas de estilo exportadas de InDesign.
 */

function purgarCSSInDesign(cssCrudo) {
    if (typeof cssCrudo !== 'string') return '';

    let cssLimpio = cssCrudo;

    // 1. Eliminar comentarios y artefactos de color corruptos de InDesign
    // Ej: color: /* InDesign Color: TITULO Constitucion */; -> se elimina
    cssLimpio = cssLimpio.replace(/color:\s*\/\*[\s\S]*?\*\/;\s*/gi, '');

    // 2. Corregir y neutralizar fuentes 'undefined' en selectores de carácter
    cssLimpio = cssLimpio.replace(/font-family:\s*['"]undefined['"]\s*,\s*sans-serif;/gi, '/* fuente heredada omitida */');

    // 3. Normalizar clases con nombres irregulares (ej: P-rrafo-b-sico)
    cssLimpio = cssLimpio.replace(/\.P-rrafo-b-sico/g, '.P01_PARRAFO_BASICO');

    return cssLimpio;
}

module.exports = { purgarCSSInDesign };