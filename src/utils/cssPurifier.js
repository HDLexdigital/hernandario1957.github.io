/**
 * core/utils/cssPurifier.js
 * Utilidad experta para revisar, depurar y rectificar hojas de estilo exportadas de InDesign.
 */

'use strict';

const { resolverPresentation } = require('../adaptadores/PresentationResolver');

/**
 * (E13.4) Traduce el objeto canónico de presentación a propiedades físicas CSS.
 * Barrera estricta: Garantiza matemáticamente que #aN, NaN o Infinity jamás lleguen a la hoja de estilos.
 */
function resolverDeclaracionesCSS(presentationCanonica) {
    if (!presentationCanonica || typeof presentationCanonica !== 'object') {
        return {};
    }

    const declaraciones = {};

    if (
        typeof presentationCanonica.color === 'string' &&
        /^#[0-9a-f]{6}$/i.test(presentationCanonica.color)
    ) {
        declaraciones.color = presentationCanonica.color.toLowerCase();
    }

    const alineacionesValidas = new Set(['left', 'center', 'right', 'justify']);
    if (alineacionesValidas.has(presentationCanonica.textAlign)) {
        declaraciones['text-align'] = presentationCanonica.textAlign;
    }

    return declaraciones;
}


function purgarCSSInDesign(cssCrudo, styleBridge = null) {
    if (typeof cssCrudo !== 'string' || cssCrudo.trim() === '') {
        return '';
    }

    let cssLimpio = cssCrudo;

    // ==========================================
    // 1. EXTIRPAR BUGS Y PROPIEDADES CORRUPTAS (El Asesino del #aN)
    // ==========================================
    cssLimpio = cssLimpio.replace(/color:\s*#aN\s*;/gi, '');
    cssLimpio = cssLimpio.replace(/color:\s*\/\*[\s\S]*?\*\/;/gi, '');
    cssLimpio = cssLimpio.replace(/font-family:\s*['"]undefined['"]\s*,\s*sans-serif;/gi, '');

    // ==========================================
    // 2. NORMALIZAR SELECTORES IRREGULARES (Unificación 3.0 - Tolerancia Absoluta)
    // ==========================================
    cssLimpio = cssLimpio.replace(/\.05-Hiperlink_char/g, '.C05_HIPERLINK_CHAR');
    cssLimpio = cssLimpio.replace(/\.P-rrafo-b-sico/g, '.P01_PARRAFO_BASICO');

    if (styleBridge && typeof styleBridge === 'object') {
        for (const estilo of Object.keys(styleBridge)) {
            const puente = styleBridge[estilo];
            if (puente.className) {
                // Extraer nombre puro ignorando carpetas (ej: "Grupo>P02_TITLE_PART" -> "P02_TITLE_PART")
                const nombreBase = estilo.split('>').pop().split(':').pop();
                
                // Generar patrón que ignore si InDesign usó guiones, barras bajas o nada
                // Ej: "P02_TITLE_PART" -> /P02[-_]?TITLE[-_]?PART/gi
                const patronTolerante = nombreBase.replace(/[^a-zA-Z0-9]/g, '[-_]?');
                
                // (?=[\s,{]) asegura que atrape exactamente el nombre del selector
                const regexInDesign = new RegExp(`\\.(${patronTolerante})(?=[\\s,{])`, 'gi');
                
                // Renombrado infalible: InDesign class -> Semantic class
                cssLimpio = cssLimpio.replace(regexInDesign, `.${puente.className}`);
            }
        }
    }

    // ==========================================
    // 3. INYECCIÓN SEGURA (E13.4 - Rehidratación)
    // ==========================================
    if (styleBridge && typeof styleBridge === 'object') {
        for (const estilo of Object.keys(styleBridge)) {
            const puente = styleBridge[estilo];
            if (!puente.className) continue;

            const presentationCanonica = resolverPresentation(puente.presentation);
            const declaracionesSeguras = resolverDeclaracionesCSS(presentationCanonica);
            const properties = Object.keys(declaracionesSeguras);

            if (properties.length > 0) {
                const reglasStr = properties.map(k => `${k}: ${declaracionesSeguras[k]};`).join(' ');
                
                const safeClass = puente.className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regexBloque = new RegExp(`(\\.${safeClass}\\s*\\{[^}]*)(\\})`, 'i');
                
                if (regexBloque.test(cssLimpio)) {
                    // ¡Fusión! Mete las reglas justo antes del cierre }
                    cssLimpio = cssLimpio.replace(regexBloque, `$1  ${reglasStr}\n$2`);
                } else {
                    // Plan B (InDesign no exportó el estilo o estaba vacío)
                    cssLimpio += `\n.${puente.className} {\n  ${reglasStr}\n}\n`;
                }
            }
        }
    }

    // ==========================================
    // 4. LA PURGA FANTASMA (REGLAS VACÍAS)
    // ==========================================
    let cssAnterior;
    do {
        cssAnterior = cssLimpio;
        cssLimpio = cssLimpio.replace(/(^|}|\n)\s*([^{}]+)\s*\{\s*(?:\/\*[\s\S]*?\*\/\s*)*\}/g, '$1');
    } while (cssLimpio !== cssAnterior);

    // ==========================================
    // 5. EMBELLECIMIENTO FINAL (BEAUTIFY)
    // ==========================================
    cssLimpio = cssLimpio.replace(/\n\s*\n\s*\n/g, '\n\n').trim();

    return cssLimpio;
}

module.exports = { 
    purgarCSSInDesign,
    resolverDeclaracionesCSS 
};