'use strict';

/**
 * core/motorGrepJuridico.js
 * Motor centralizado y puro de evaluación GREP jurídica.
 * Totalmente agnóstico del filesystem, rutas y disco duro.
 */

// 1. Reglas base inquebrantables del sistema jurídico
const REGLAS_BASE = [
    {
        patron: /^(PORTADA|FALSA\s+PORTADA)$/i,
        tipo: 'preliminar_portada',
        epubType: 'cover',
        nivelHtml: 1
    },
    {
        patron: /^PÁGINA\s+LEGAL$/i,
        tipo: 'preliminar_legal',
        epubType: 'copyright-page',
        nivelHtml: 1
    },
    {
        patron: /^ÍNDICE(?:\s+DE\s+CONTENIDO)?$/i,
        tipo: 'preliminar_indice',
        epubType: 'toc',
        nivelHtml: 1
    },
    {
        patron: /^(INTRODUCCIÓN|PREFACIO|PRÓLOGO|PRESENTACIÓN)$/i,
        tipo: 'preliminar_prologo',
        epubType: 'preface',
        nivelHtml: 1
    },
    {
        patron: /^LIBRO\s+[IVXLCDM]+\b/i,
        tipo: 'libro',
        epubType: 'volume',
        nivelHtml: 1
    },
    {
        patron: /^TÍTULO\s+[IVXLCDM]+\b/i,
        tipo: 'titulo_parte',
        epubType: 'part',
        nivelHtml: 2
    },
    {
        patron: /^CAPÍTULO\s+[IVXLCDM]+\b/i,
        tipo: 'capitulo',
        epubType: 'chapter',
        nivelHtml: 3
    },
    {
        patron: /^SECCIÓN\s+[IVXLCDM]+\b/i,
        tipo: 'seccion',
        epubType: 'section',
        nivelHtml: 4
    },
    {
        patron: /^Artículo\s+\d+/i,
        tipo: 'articulo',
        epubType: 'article',
        nivelHtml: 5
    },
    {
        patron: /^Parágrafo(?:\s+transitorio)?(?:\s+\d+|\s+nuevo)?\.?/i,
        tipo: 'paragrafo_normativo',
        epubType: 'notice',
        nivelHtml: 6
    },
    {
        patron: /^(?:[a-z]\)|\d+\.\d+)\s+/i,
        tipo: 'inciso',
        epubType: 'list-item',
        nivelHtml: 6
    },
    {
        patron: /^GLOSARIO$/i,
        tipo: 'glosario_titulo',
        epubType: 'backmatter',
        nivelHtml: 2
    }
];

/**
 * Evalúa un token de texto utilizando un conjunto de reglas activas inyectadas en memoria.
 * 
 * @param {string} texto - Texto del token a evaluar.
 * @param {Array} [reglasDinamicas=[]] - Opcional: reglas externas cargadas por la infraestructura.
 * @returns {Object} Resultado de la clasificación semántica.
 */
function evaluarTokenConGrep(texto, reglasDinamicas = []) {
    const textoLimpio = (texto || '').trim();
    
    // Unimos las reglas dinámicas inyectadas al frente y las base al fondo
    const reglasActivas = [...reglasDinamicas, ...REGLAS_BASE];

    for (const regla of reglasActivas) {
        if (regla.patron.test(textoLimpio)) {
            return {
                tipo: regla.tipo,
                epubType: regla.epubType,
                nivelHtml: regla.nivelHtml,
                coincidioGrep: true
            };
        }
    }

    return {
        tipo: 'texto_cuerpo',
        epubType: 'body',
        nivelHtml: 6,
        coincidioGrep: false
    };
}

module.exports = { evaluarTokenConGrep, REGLAS_BASE };