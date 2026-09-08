/**
 * @fileoverview src/adaptadores/PresentationResolver.js
 * Traduce el vocabulario normalizado de E13.1 a propiedades de presentación canónicas para CSS.
 */

'use strict';

const JUSTIFICATION_TO_CSS = Object.freeze({
    LEFT_ALIGN: 'left',
    CENTER_ALIGN: 'center',
    RIGHT_ALIGN: 'right',
    FULLY_JUSTIFIED: 'justify'
});

/**
 * Resuelve un objeto presentation y retorna propiedades CSS seguras.
 * @param {Object} presentation - Objeto de presentación proveniente del mapa semántico.
 * @returns {Object} Propiedades CSS canónicas (ej. { color, textAlign }).
 */
function resolverPresentation(presentation) {
    if (!presentation || typeof presentation !== 'object') {
        return {};
    }

    const resultado = {};

    // Validar color RGB estrictamente en formato hexadecimal
    if (typeof presentation.color === 'string' &&
        /^#[0-9a-f]{6}$/i.test(presentation.color)) {
        resultado.color = presentation.color.toLowerCase();
    }
    // Nota: Los objetos CMYK se omiten de forma conservadora en esta fase para evitar aproximaciones de color no contractuales.

    // Traducir alineación de Adobe a text-align canónico
    if (typeof presentation.justification === 'string') {
        const textAlign = JUSTIFICATION_TO_CSS[presentation.justification];
        if (textAlign) {
            resultado.textAlign = textAlign;
        }
    }

    return resultado;
}

module.exports = {
    resolverPresentation
};