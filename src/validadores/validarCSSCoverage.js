/**
 * src/validadores/validarCSSCoverage.js
 *
 * Fase E7 — Validador de Cobertura CSS Editorial
 *
 * Responsabilidad exclusiva:
 *     Auditar la correspondencia estricta entre las clases semánticas utilizadas
 *     en el XHTML (E4) y las reglas de selectores presentes en la hoja CSS.
 *     No modifica ni repara el XHTML ni el CSS, ni genera estilos.
 */

/**
 * Extrae todas las clases referenciadas en los atributos class del XHTML.
 * @param {string} xhtmlString 
 * @returns {Set<string>}
 */
function extractUsedClasses(xhtmlString) {
    const usedClasses = new Set();
    if (typeof xhtmlString !== 'string') return usedClasses;

    // Captura atributos class="..." o class='...'
    const classAttrRegex = /class\s*=\s*(["'])(.*?)\1/gi;
    let match;

    while ((match = classAttrRegex.exec(xhtmlString)) !== null) {
        const classNames = match[2].split(/\s+/);
        for (const cls of classNames) {
            const trimmed = cls.trim();
            if (trimmed) {
                usedClasses.add(trimmed);
            }
        }
    }

    return usedClasses;
}

/**
 * Indexa las clases definidas como selectores en el texto CSS.
 * @param {string} cssText 
 * @returns {Set<string>}
 */
function indexCSSClasses(cssText) {
    const cssClasses = new Set();
    if (typeof cssText !== 'string') return cssClasses;

    // Remover comentarios CSS para evitar falsos positivos
    const cleanCss = cssText.replace(/\/\*[\s\S]*?\*\//g, '');

    // Captura selectores de clase (.nombre-clase)
    const classSelectorRegex = /\.([a-zA-Z_][a-zA-Z0-9_\-]*)/g;
    let match;

    while ((match = classSelectorRegex.exec(cleanCss)) !== null) {
        cssClasses.add(match[1]);
    }

    return cssClasses;
}

/**
 * Compara las clases utilizadas en el XHTML frente a las disponibles en el CSS.
 * 
 * @param {string} xhtmlString 
 * @param {string} cssText 
 * @returns {Object} Diagnóstico estructurado de cobertura
 */
function validateCSSCoverage(xhtmlString, cssText) {
    const usedSet = extractUsedClasses(xhtmlString);
    const cssSet = indexCSSClasses(cssText);

    const usedClasses = Array.from(usedSet).sort();
    const missingClasses = [];

    for (const cls of usedSet) {
        if (!cssSet.has(cls)) {
            missingClasses.push(cls);
        }
    }

    missingClasses.sort();

    return {
        valid: missingClasses.length === 0,
        usedClasses,
        missingClasses
    };
}

module.exports = {
    extractUsedClasses,
    indexCSSClasses,
    validateCSSCoverage
};