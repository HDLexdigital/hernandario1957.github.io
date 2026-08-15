/**
 * Fachada Pública del Pipeline Modular de LexDigitalHD
 * Contrato C.45 / C.46: Orquestador de Fronteras y Artefacto Estructurado
 */
'use strict';

const { performance } = require('perf_hooks');
const { adaptarInDesign } = require('./adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('./compiladores/compilarLexmotor');
const { constructorXHTML } = require('./constructores/constructorXHTML');
const { ensamblarDocumentoXHTML } = require('./constructores/ensambladorDocumento');
const { Metricas } = require('./utils/metricas');

/**
 * Orquesta el flujo completo desde el JSON crudo hasta el artefacto estructurado de salida,
 * aislando la complejidad interna del cliente.
 *
 * @param {Object} jsonCrudo - El JSON exportado desde InDesign.
 * @param {Object} [opciones={}] - Opciones de metadatos (title, cssName, lang, nombreBase).
 * @returns {Object} - El artefacto canónico { jsonOficial, xhtml, metadatos }.
 */
function ejecutarPipelineModular(jsonCrudo, opciones = {}) {
	if (!jsonCrudo || typeof jsonCrudo !== 'object' || Array.isArray(jsonCrudo)) {
        throw new Error("ERR_INVALID_INPUT: El orquestador requiere un jsonCrudo válido.");
    }

    // Guardia estructural para bloquear objetos arbitrarios anómalos (ej. { foo: 'bar' })
    if (!jsonCrudo.tokens && !jsonCrudo.contenido && !jsonCrudo.documento) {
        throw new Error("ERR_INVALID_INPUT: El jsonCrudo carece de una estructura semántica válida.");
    }

    const metricas = new Metricas('Pipeline Modular');
    const tiempoInicio = performance.now();

    // 1. Frontera E10: Adaptación (JSON InDesign -> AST Canónico LEDM)
    const adaptado = adaptarInDesign({ jsonCrudo });

    // 2. Frontera Core: Compilación (Resolución semántica y de presentación)
    const compilado = compilarLexmotor(adaptado.ast);

    // 3. Frontera Renderer: Serialización a Fragmentos XHTML (Dumb Pipe - C.42)
    const xhtmlFragmento = constructorXHTML(compilado.ast.contenido);

    // 4. Frontera Ensamblador: Documento XML/EPUB3 con Raíz Única (C.43/C.44)
    const xhtmlFinal = ensamblarDocumentoXHTML(xhtmlFragmento, opciones);

    const tiempoTotal = performance.now() - tiempoInicio;

    // 5. Construcción del Artefacto Canónico de Salida (C.46)
    return {
        jsonOficial: {
            documento: adaptado.ast.documento || 'documento_desconocido',
            tokens: compilado.ast.contenido
        },
        xhtml: xhtmlFinal,
        metadatos: {
            nombre: opciones.nombreBase || 'documento_lexdigital',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            tiempoTotal: parseFloat(tiempoTotal.toFixed(2))
        }
    };
}

module.exports = {
    ejecutarPipelineModular
};