'use strict';

/**
 * index.js - El Orquestador de Producción de LexDigital (v2)
 * Conecta las fases de procesamiento aplicando la Capa Anticorrupción (E10)
 * y el motor de compilación XHTML modular con accesibilidad WCAG 2.1 AA.
 */
const { adaptarInDesign } = require('./src/adaptadores/InDesignAdapter');
const compiladorV2 = require('./core/compilarLexmotor_v2');

/**
 * Función orquestadora principal para la compilación de documentos jurídicos.
 * @param {Object} jsonCrudo - Datos crudos o tokens provenientes de InDesign / UXP.
 * @param {string} nombreBase - Nombre base para los artefactos.
 * @param {string} nombreCSS - Nombre de la hoja de estilos externa.
 * @param {Object} semanticMap - Mapa semántico opcional de estilos.
 * @param {Object} opcionesAvanzadas - Configuración de accesibilidad y validación.
 * @returns {Object} { jsonOficial, xhtml, metadatos, validacion }
 */
function compilarLexmotor(jsonCrudo, nombreBase, nombreCSS, semanticMap = null, opcionesAvanzadas = {}) {
    // Fase 0: Capa Anticorrupción (E10) - Pasarela Dialecto Tokens
    let datosEntrada = jsonCrudo;
    if (jsonCrudo && Array.isArray(jsonCrudo.tokens)) {
        const resultadoAdaptacion = adaptarInDesign({ 
            jsonCrudo, 
            semanticMap: semanticMap || jsonCrudo.semanticMap 
        });
        datosEntrada = resultadoAdaptacion.ast;
    }

    // Fase 1 & 2: Normalización y Adaptación Estructural via Módulos V2
    // Preparamos las opciones predeterminadas para el compilador modular
    const opcionesCompilacion = {
        titulo: jsonCrudo?.documento?.titulo || jsonCrudo?.titulo || nombreBase || 'Documento Jurídico',
        idioma: 'es-CO',
        validar: true,
        generarTOC: true,
        nivelAccesibilidad: 'AA',
        ...opcionesAvanzadas
    };

    // Fase 3 & 4: Ensamblaje XHTML moderno, parsing jurídico, fragmentos y ARIA
    const resultadoCompilacion = compiladorV2.compilarAXHTML(datosEntrada, opcionesCompilacion);

    if (!resultadoCompilacion.xhtml) {
        throw new Error(`Error crítico en compilación XHTML: ${JSON.stringify(resultadoCompilacion.errores)}`);
    }

    return {
        jsonOficial: datosEntrada,
        xhtml: resultadoCompilacion.xhtml,
        metadatos: resultadoCompilacion.metadatos,
        validacion: resultadoCompilacion.validacion
    };
}

module.exports = { compilarLexmotor };