/**
 * src/extraction/InDesignValueNormalizer.js
 * Capa Anticorrupción (E13.1): Normalización estricta de valores nativos de InDesign.
 * Garantiza que ningún dato corrupto, NaN, Infinity o arbitrario cruce la frontera.
 */

'use strict';

/**
 * Normaliza de forma estricta el color de relleno (fillColor) de InDesign.
 * 
 * @param {Object|String} colorObj - Objeto color, muestra o cadena de InDesign.
 * @returns {String|Object|null} Hexadecimal (#rrggbb), objeto estructurado CMYK o null.
 */
function normalizarColorInDesign(colorObj) {
    if (colorObj === null || colorObj === undefined) {
        return null;
    }

    try {
        // 1. Si llega como cadena de texto
        if (typeof colorObj === 'string') {
            var trimmed = colorObj.trim();
            if (/none/i.test(trimmed) || trimmed === '') {
                return null;
            }
            // Aceptar únicamente strings que sean estrictamente un hexadecimal válido (#rrggbb)
            if (/^#[0-9a-f]{6}$/i.test(trimmed)) {
                return trimmed.toLowerCase();
            }
            // Cualquier otro string arbitrario o desconocido se rechaza
            return null;
        }

        // 2. Si es un objeto de InDesign con propiedad colorValue (Swatch / Color)
        if (typeof colorObj === 'object') {
            // Validar acceso seguro a colorValue sin asumir propiedad enumerable directa
            var vals = colorObj.colorValue;
            if (!Array.isArray(vals)) {
                return null;
            }

            // Validar que todos los componentes sean números válidos y finitos
            for (var i = 0; i < vals.length; i++) {
                var v = vals[i];
                if (typeof v !== 'number' || isNaN(v) || !isFinite(v)) {
                    return null; // Componente corrupto detectado
                }
            }

            // Si es RGB (3 componentes) -> Generar hexadecimal inequívoco de inmediato
            if (vals.length === 3) {
                var r = Math.max(0, Math.min(255, Math.round(vals[0])));
                var g = Math.max(0, Math.min(255, Math.round(vals[1])));
                var b = Math.max(0, Math.min(255, Math.round(vals[2])));
                return rgbAHex(r, g, b);
            }

            // Si es CMYK (4 componentes) -> Conservar como dato estructurado seguro
            if (vals.length === 4) {
                return {
                    model: "CMYK",
                    values: [
                        Math.max(0, Math.min(100, vals[0])),
                        Math.max(0, Math.min(100, vals[1])),
                        Math.max(0, Math.min(100, vals[2])),
                        Math.max(0, Math.min(100, vals[3]))
                    ]
                };
            }
        }

        return null;
    } catch (e) {
        return null; // Fail-safe ante cualquier excepción imprevista
    }
}

/**
 * Convierte componentes RGB a Hexadecimal de forma acotada.
 */
function rgbAHex(r, g, b) {
    function toHex(c) {
        var hex = c.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }
    return "#" + toHex(r) + toHex(g) + toHex(b);
}

/**
 * Normaliza de forma segura la propiedad justification de un párrafo de InDesign,
 * conservando el dialecto nativo de Adobe acotado a constantes controladas.
 * 
 * @param {Object|String|Number} justificationProp - Propiedad justification de InDesign.
 * @returns {String} Constante de alineación Adobe controlada.
 */
function normalizarJustificationInDesign(justificationProp) {
    if (justificationProp === null || justificationProp === undefined) {
        return "LEFT_ALIGN";
    }

    var valStr = "";
    try {
        valStr = justificationProp.toString().toUpperCase().trim();
    } catch (e) {
        return "LEFT_ALIGN";
    }

    // Vocabulario controlado y permitido
    if (valStr.indexOf("CENTER") !== -1) return "CENTER_ALIGN";
    if (valStr.indexOf("RIGHT") !== -1) return "RIGHT_ALIGN";
    if (valStr.indexOf("FULLY") !== -1 || valStr.indexOf("FULL") !== -1) return "FULLY_JUSTIFIED";
    if (valStr.indexOf("LEFT") !== -1) return "LEFT_ALIGN";

    // Constantes numéricas de respaldo de Adobe
    if (justificationProp === 1851876449) return "LEFT_ALIGN";      // Justification.LEFT_ALIGN
    if (justificationProp === 1668247156) return "CENTER_ALIGN";    // Justification.CENTER_ALIGN
    if (justificationProp === 1918987363) return "RIGHT_ALIGN";     // Justification.RIGHT_ALIGN
    if (justificationProp === 1718773088) return "FULLY_JUSTIFIED"; // Justification.FULLY_JUSTIFIED

    // Valor desconocido o fuera del contrato -> Fallback estricto
    return "LEFT_ALIGN";
}

module.exports = {
    normalizarColorInDesign,
    normalizarJustificationInDesign
};