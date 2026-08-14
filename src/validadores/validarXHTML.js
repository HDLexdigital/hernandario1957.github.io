/**
 * src/validadores/validarXHTML.js
 *
 * Fase E6 — Validador XHTML
 *
 * Responsabilidad exclusiva:
 *     Auditar la corrección estructural y de escape del XHTML generado.
 *     Lanza un error diagnóstico si detecta cualquier infracción.
 *
 * No modifica ni repara el XHTML.
 */

/**
 * Valida la corrección sintáctica y estructural de una cadena XHTML.
 * 
 * @param {string} xhtmlString 
 * @returns {boolean} true si es válido.
 * @throws {Error} Si el XHTML está mal formado o infringe el contrato.
 */
function validarXHTML(xhtmlString) {
    if (typeof xhtmlString !== 'string') {
        throw new TypeError("El XHTML a validar debe ser una cadena de texto.");
    }

    if (xhtmlString.trim() === '') {
        throw new Error("El documento XHTML está vacío.");
    }

    // 1. Validación de entidades y ampersands sueltos
    const ampersandRegex = /&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g;
    if (ampersandRegex.test(xhtmlString)) {
        throw new Error("Error de validación XHTML: Se detectó un carácter '&' sin escapar correctamente.");
    }

    // 2. Validación estructural de etiquetas y detección estricta de '<' o '>' sueltos en el texto
    const stack = [];
    const tagRegex = /<(\/)?([a-zA-Z_][a-zA-Z0-9._:\-]*)(?:\s+[^>]*?)?(\/)?>/g;
    
    let lastIndex = 0;
    let match;

    while ((match = tagRegex.exec(xhtmlString)) !== null) {
        const matchIndex = match.index;
        const fullMatch = match[0];
        const isClosing = Boolean(match[1]);
        const tagName = match[2].toLowerCase();
        const isSelfClosing = Boolean(match[3]) || fullMatch.endsWith('/>');

        // Verificar rigurosamente el texto entre la etiqueta anterior y la actual
        const textSegment = xhtmlString.substring(lastIndex, matchIndex);
        if (textSegment.includes('<') || textSegment.includes('>')) {
            throw new Error("Error de validación XHTML: Se detectó un carácter '<' o '>' suelto o malformado en el texto.");
        }

        if (isClosing) {
            if (stack.length === 0) {
                throw new Error(`Error de validación XHTML: Etiqueta de cierre '</${tagName}>' sin apertura previa.`);
            }
            const expectedTag = stack.pop();
            if (expectedTag !== tagName) {
                throw new Error(`Error de validación XHTML: Anidamiento inválido. Se esperaba cerrar '</${expectedTag}>' pero se encontró '</${tagName}>'.`);
            }
        } else if (!isSelfClosing) {
            stack.push(tagName);
        }

        lastIndex = tagRegex.lastIndex;
    }

    // Validar el texto restante al final del documento (después de la última etiqueta)
    const remainingText = xhtmlString.substring(lastIndex);
    if (remainingText.includes('<') || remainingText.includes('>')) {
        throw new Error("Error de validación XHTML: Se detectó un carácter '<' o '>' suelto o malformado en el texto.");
    }

    if (stack.length > 0) {
        throw new Error(`Error de validación XHTML: Etiquetas sin cerrar al final del documento: ${stack.join(', ')}.`);
    }

    return true;
}

module.exports = {
    validarXHTML
};