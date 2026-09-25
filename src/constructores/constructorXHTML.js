/**
 * src/constructores/constructorXHTML.js
 * Proyector XHTML Pasivo (Implementación C01-04)
 */

function construirNodoXHTML(token, opciones) {
    // 1. Validación de Contexto de Proyección (SEM-13)
    if (!opciones || !opciones.perfil) {
        throw new Error("[LexMotor] Perfil de salida requerido (WEB o EPUB).");
    }
    const perfil = opciones.perfil;
    if (perfil !== 'WEB' && perfil !== 'EPUB') {
        throw new Error(`[LexMotor] Perfil de salida desconocido: ${perfil}`);
    }

    // 2. Proyección Pasiva (SEM-12): El token dicta el elemento HTML
    const tag = token.htmlElement;
    if (!tag) {
        // En caso de tokens de texto puro o anómalos, retornar solo el contenido
        return token.texto || ""; 
    }

    let atributos = [];

    // 3. Reglas de Serialización por Perfil (Perfil WEB suprime epub:type)
    if (perfil === 'EPUB' && token.epubType !== null && token.epubType !== undefined) {
        atributos.push(`epub:type="${token.epubType}"`);
    }

    // Atributos universales dictados por el token
    if (token.ariaRole !== null && token.ariaRole !== undefined) {
        atributos.push(`role="${token.ariaRole}"`);
    }

    if (token.ariaHidden === true) {
        atributos.push(`aria-hidden="true"`);
    }

    if (token.lang !== null && token.lang !== undefined) {
        atributos.push(`lang="${token.lang}"`);
    }

    // Si el sistema inyectó clases (como resabio visual), las proyectamos,
    // aunque el contrato C01-04 se enfoca en semántica y accesibilidad.
    if (token.resolvedClass) {
        atributos.push(`class="${token.resolvedClass}"`);
    }

    const attrString = atributos.length > 0 ? " " + atributos.join(" ") : "";

    // 4. Procesamiento de Hijos (Recursividad)
    let innerHTML = "";
    if (token.contenido && Array.isArray(token.contenido)) {
        innerHTML = token.contenido.map(child => construirNodoXHTML(child, opciones)).join("");
    } else {
        innerHTML = token.texto || "";
    }

    return `<${tag}${attrString}>${innerHTML}</${tag}>`;
}

module.exports = { construirNodoXHTML };
