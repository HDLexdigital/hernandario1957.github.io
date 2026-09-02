'use strict';
/**
 * index.js - Orquestador Principal de LexDigital (v2)
 * Compatible con server.js y API unificada
 */
// ============ CARGAR MÓDULOS ============
// Cargar compilador v2 (desde la nueva ubicación)
let compiladorV2;
try {
    compiladorV2 = require('./core/compilarLexmotor_v2');
    if (!compiladorV2.compilarAXHTML) {
        compiladorV2 = require('./src/core/compiladores/compilarLexmotor');
    }
} catch (e) {
    try {
        compiladorV2 = require('./src/core/compiladores/compilarLexmotor');
    } catch (e2) {
        console.error('❌ No se pudo cargar el compilador:', e2.message);
        compiladorV2 = null;
    }
}
// Cargar adaptador InDesign
let adaptarInDesign;
try {
    ({ adaptarInDesign } = require('./src/adaptadores/InDesignAdapter'));
} catch (e) {
    console.warn('⚠️ InDesignAdapter no disponible:', e.message);
    adaptarInDesign = (datos) => ({ ast: datos });
}
// ============ CLASES DE ERROR ============
class PipelineError extends Error {
    constructor(mensaje) {
        super(mensaje);
        this.name = 'PipelineError';
    }
}
class ValidationError extends Error {
    constructor(mensaje) {
        super(mensaje);
        this.name = 'ValidationError';
    }
}
// ============ FUNCIONES PRINCIPALES ============
function validarCompatibilidad(datos) {
    return {
        compatible: true,
        version: '2.0.0',
        timestamp: new Date().toISOString()
    };
}
/**
 * Función orquestadora principal
 */
function compilarLexmotor(jsonCrudo, nombreBase, nombreCSS, semanticMap = null, opcionesAvanzadas = {}) {
    // Fase 0: Adaptación
    let datosEntrada = jsonCrudo;
    if (jsonCrudo && Array.isArray(jsonCrudo.tokens)) {
        const resultadoAdaptacion = adaptarInDesign({
            jsonCrudo,
            semanticMap: semanticMap || jsonCrudo.semanticMap
        });
        datosEntrada = resultadoAdaptacion.ast;
    }
    // Preparar opciones
    const opcionesCompilacion = {
        titulo: jsonCrudo?.documento?.titulo || jsonCrudo?.titulo || nombreBase || 'Documento Jurídico',
        idioma: 'es-CO',
        validar: true,
        generarTOC: true,
        nivelAccesibilidad: 'AA',
        ...opcionesAvanzadas
    };
    // Compilar
    if (!compiladorV2) {
        throw new PipelineError('Compilador no disponible');
    }
    let resultadoCompilacion;
    if (compiladorV2.compilarAXHTML) {
        resultadoCompilacion = compiladorV2.compilarAXHTML(datosEntrada, opcionesCompilacion);
    } else if (compiladorV2.compilarLexmotor) {
        resultadoCompilacion = compiladorV2.compilarLexmotor(datosEntrada, opcionesCompilacion);
    } else {
        throw new PipelineError('Formato de compilador no reconocido');
    }
    if (!resultadoCompilacion || !resultadoCompilacion.xhtml) {
        throw new PipelineError('Error en compilación XHTML');
    }
    return {
        jsonOficial: datosEntrada,
        xhtml: resultadoCompilacion.xhtml,
        metadatos: resultadoCompilacion.metadatos,
        validacion: resultadoCompilacion.validacion
    };
}
// ============ API UNIFICADA ============
class LexDigitalCompiler {
    constructor(opciones = {}) {
        this.version = '2.0.0';
        this.opciones = opciones;
    }
    async compilar(jsonData, opciones = {}) {
        return await compilarLexmotor(jsonData, jsonData.titulo, null, null, { ...this.opciones, ...opciones });
    }
    validar(jsonData) {
        return { exito: true, errores: [] };
    }
}
// ============ EXPORTAR TODO ============
module.exports = {
    // API Principal
    Compiler: LexDigitalCompiler,
    compilar: (jsonData, opciones) => new LexDigitalCompiler(opciones).compilar(jsonData),
    version: '2.0.0',
    // Compatibilidad con server.js
    compilarLexmotor,
    validarCompatibilidad,
    PipelineError,
    ValidationError
};