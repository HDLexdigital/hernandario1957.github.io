/**
 * index.js - El Orquestador de LexDigital
 * Este archivo une las fases de procesamiento. No lee ni escribe archivos.
 */
const { normalizarJSON } = require('./core/validadorJson');
const { aplicarReglasJuridicas } = require('./core/clasificadorLegal');
const { construirEstructura } = require('./core/constructorXHTML');
const { procesarDOM } = require('./core/postProcesadorDom');

function compilarLexmotor(jsonCrudo, nombreBase, nombreCSS) {
    // Fase 1: Limpieza
    const jsonEstructurado = normalizarJSON(jsonCrudo, nombreBase);
    
    // Fase 2: Mapeo Jurídico
    const tokensClasificados = aplicarReglasJuridicas(jsonEstructurado.tokens);
    
    // Fase 3: Ensamblaje HTML
	const htmlBase = construirEstructura(tokensClasificados, jsonEstructurado.documento, nombreCSS);    
    // Fase 4: Transformación XML final
    const xhtmlFinal = procesarDOM(htmlBase);

    return {
        jsonOficial: jsonEstructurado,
        xhtml: xhtmlFinal
    };
}

module.exports = { compilarLexmotor };