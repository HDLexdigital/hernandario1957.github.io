/**
 * TypeResolver — Resolución de Ontología Base (E12)
 */

'use strict';

const TIPO_BASE_MAP = Object.freeze({
    P02_TITLE_PART: 'titulo_parte',
    P02_TITLE_MAIN: 'titulo_parte',
    P02_TITLE_CHAPTER: 'capitulo',
    P03_CENTER_BOLD: 'seccion',
    P01_BODY_BASE: 'texto_cuerpo',
    P01_BODY_CONT: 'parrafo',
    P07_INDENT_L1: 'parrafo'
});

function resolverTipoBase(estilo) {
    if (!estilo || typeof estilo !== 'string') return 'parrafo';
    const clave = estilo.trim();
    return TIPO_BASE_MAP[clave] || 'parrafo';
}

module.exports = {
    resolverTipoBase,
    TIPO_BASE_MAP
};