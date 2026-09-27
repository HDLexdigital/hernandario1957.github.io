'use strict';
/**
 * core/utils/cssPurifier.js
 * Módulo encargado de limpiar, sanear y purgar estilos de InDesign para CSS/XHTML.
 */

function purgarCSSInDesign(cssCrudo) {
    if (typeof cssCrudo !== 'string' || cssCrudo.trim() === '') {
        return '';
    }

    let cssLimpio = cssCrudo;

    // Saneamiento de colores swatch de InDesign sin formato CSS válido
    cssLimpio = cssLimpio.replace(/color:\s*\/\*[\s\S]*?\*\/;/gi, 'color: #1a1a1a;');
    cssLimpio = cssLimpio.replace(/color:\s*TITULO[^\n;]*;/gi, 'color: #1a365d;');
    cssLimpio = cssLimpio.replace(/color:\s*Capitulo[^\n;]*;/gi, 'color: #2b6cb0;');
    cssLimpio = cssLimpio.replace(/background-color:\s*Azul\s*Borgona;/gi, 'background-color: #2c5282;');
    cssLimpio = cssLimpio.replace(/background-color:\s*Sombra_Titulo;/gi, 'background-color: #edf2f7;');

    // Saneamiento de fuentes 'undefined'
    cssLimpio = cssLimpio.replace(/font-family:\s*['"]undefined['"]\s*,\s*sans-serif;/gi, 'font-family: \'Liberation Serif\', serif;');

    // Corrección de selectores especiales
    cssLimpio = cssLimpio.replace(/\.05-Hiperlink_char/g, '.C05_HIPERLINK_CHAR');
    cssLimpio = cssLimpio.replace(/\.P-rrafo-b-sico/g, '.P01_PARRAFO_BASICO');

    return cssLimpio;
}

module.exports = {
    purgarCSSInDesign
};
