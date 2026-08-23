/**
 * Fachada Pública del Pipeline Modular de LexDigitalHD
 * Contrato C.45 / C.46: Orquestador de Fronteras y Artefacto Estructurado
 * E15.6: PERSISTENCIA CENTRALIZADA (El Core es puro, el Orquestador escribe).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

const { adaptarInDesign } = require('./adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('./compiladores/compilarLexmotor');
const { constructorXHTML } = require('./constructores/constructorXHTML');
const { ensamblarDocumentoXHTML } = require('./constructores/ensambladorDocumento');
const { Metricas } = require('./utils/metricas');

function ejecutarPipelineModular(jsonCrudo, opciones = {}) {
    if (!jsonCrudo || typeof jsonCrudo !== 'object' || Array.isArray(jsonCrudo)) {
        throw new Error("ERR_INVALID_INPUT: El orquestador requiere un jsonCrudo válido.");
    }

    if (!jsonCrudo.tokens && !jsonCrudo.contenido && !jsonCrudo.documento) {
        throw new Error("ERR_INVALID_INPUT: El jsonCrudo carece de una estructura semántica válida.");
    }

    const metricas = new Metricas('Pipeline Modular');
    const tiempoInicio = performance.now();

    // 1. Frontera E10: Adaptación 
    const adaptado = adaptarInDesign({ jsonCrudo });
    const astSeguro = adaptado.ast || (adaptado.jsonNormalizado ? adaptado.jsonNormalizado : jsonCrudo);

    // 2. Frontera Core: Compilación (Ahora matemáticamente puro)
    // Pasamos map paths si existen, para que el Core los cargue (mantenimiento de API E12)
    const compilado = compilarLexmotor(astSeguro, opciones);
    const astCompilado = compilado.ast || astSeguro;

    const coleccionParaRender = Array.isArray(astCompilado) 
        ? astCompilado 
        : (astCompilado.contenido || astCompilado.tokens || []);
        
    const xhtmlFragmento = constructorXHTML(coleccionParaRender);

    // 4. Frontera Ensamblador
    const xhtmlFinal = ensamblarDocumentoXHTML(xhtmlFragmento, opciones);

    // 5. FRONTERA DE PERSISTENCIA (E15.6 Hexagonal)
    const artefactoDir = opciones.directorioSalida || opciones.outputFolder;
    if (artefactoDir) {
        if (!fs.existsSync(artefactoDir)) {
            fs.mkdirSync(artefactoDir, { recursive: true });
        }
        
        const nombreBase = opciones.nombreBase || 'documento';
        
        fs.writeFileSync(
            path.join(artefactoDir, `${nombreBase}.xhtml`), 
            xhtmlFinal, 
            'utf8'
        );
        
        fs.writeFileSync(
            path.join(artefactoDir, `${nombreBase}_ast.json`), 
            JSON.stringify(coleccionParaRender, null, 2), 
            'utf8'
        );
    }

    const tiempoTotal = performance.now() - tiempoInicio;

    // 6. Construcción Estricta del Artefacto Canónico (C.46)
    const respuesta = {
        jsonOficial: {
            documento: astCompilado.documento || { titulo: opciones.nombreBase || 'documento_desconocido' },
            tokens: coleccionParaRender
        },
        xhtml: xhtmlFinal,
        metadatos: {
            nombre: opciones.nombreBase || 'documento_lexdigital',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            tiempoTotal: parseFloat(tiempoTotal.toFixed(2))
        }
    };

    // Devolvemos el directorioSalida para que los tests heredados puedan asertarlo
    if (artefactoDir) {
        respuesta.directorioSalida = artefactoDir;
    }

    return respuesta;
}

module.exports = {
    ejecutarPipelineModular
};