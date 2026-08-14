'use strict';

/**
 * index.js - El Orquestador de LexDigital
 * Este archivo une las fases de procesamiento aplicando la Capa Anticorrupción (E10).
 * No lee ni escribe archivos directamente.
 */
const { adaptarInDesign } = require('./adaptadores/InDesignAdapter');
const { normalizarJSON } = require('./core/validadorJson');
//const { aplicarReglasJuridicas } = require('./core/clasificadorLegal');
const { construirEstructura } = require('./core/constructorXHTML');
const { procesarDOM } = require('./core/postProcesadorDom');

function compilarLexmotor(jsonCrudo, nombreBase, nombreCSS, semanticMap = null) {
    // Fase 0: Capa Anticorrupción (E10) - Pasarela Dialecto Tokens
    let datosEntrada = jsonCrudo;
    if (jsonCrudo && Array.isArray(jsonCrudo.tokens)) {
        const resultadoAdaptacion = adaptarInDesign({ 
            jsonCrudo, 
            semanticMap: semanticMap || jsonCrudo.semanticMap 
        });
        datosEntrada = resultadoAdaptacion.ast;
    }

    // Fase 1: Limpieza y Normalización
    const jsonEstructurado = normalizarJSON(datosEntrada, nombreBase);
    
    // Fase 2: Mapeo Jurídico
    const tokensClasificados = aplicarReglasJuridicas(
        jsonEstructurado.tokens || jsonEstructurado.contenido || []
    );
    
    // Fase 3: Ensamblaje HTML
    const htmlBase = construirEstructura(
        tokensClasificados, 
        jsonEstructurado.documento, 
        nombreCSS
    );
    
    // Fase 4: Transformación XML / XHTML final
    const xhtmlFinal = procesarDOM(htmlBase);

    return {
        jsonOficial: jsonEstructurado,
        xhtml: xhtmlFinal
    };
}

module.exports = { compilarLexmotor };