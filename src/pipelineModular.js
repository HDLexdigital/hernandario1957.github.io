/**
 * Fachada Pública del Pipeline Modular de LexDigitalHD
 * Contrato C.45: Orquestador de Fronteras
 */
'use strict';

const { adaptarInDesign } = require('./adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('./compiladores/compilarLexmotor');
const { constructorXHTML } = require('./constructores/constructorXHTML');
const { ensamblarDocumentoXHTML } = require('./constructores/ensambladorDocumento');

/**
 * Orquesta el flujo completo desde el JSON crudo hasta el documento EPUB3 final,
 * aislando la complejidad interna del cliente.
 *
 * @param {Object} jsonCrudo - El JSON exportado desde InDesign.
 * @param {Object} [opciones={}] - Opciones de metadatos (title, cssName, lang).
 * @returns {string} - El documento XHTML/XML estricto final.
 */
function ejecutarPipelineModular(jsonCrudo, opciones = {}) {
    if (!jsonCrudo) {
        throw new Error("El orquestador requiere un jsonCrudo válido.");
    }

    // 1. Frontera E10: Adaptación (JSON InDesign -> AST Canónico LEDM)
    const adaptado = adaptarInDesign({ jsonCrudo });

    // 2. Frontera Core: Compilación (Resolución semántica y de presentación)
    const compilado = compilarLexmotor(adaptado.ast);

    // 3. Frontera Renderer: Serialización a Fragmentos XHTML (Dumb Pipe - C.42)
    const xhtmlFragmento = constructorXHTML(compilado.ast.contenido);

    // 4. Frontera Ensamblador: Documento XML/EPUB3 con Raíz Única (C.43/C.44)
    const xhtmlFinal = ensamblarDocumentoXHTML(xhtmlFragmento, opciones);

    return xhtmlFinal;
}

module.exports = {
    ejecutarPipelineModular
};