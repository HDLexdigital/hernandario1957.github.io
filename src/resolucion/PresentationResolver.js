/**
 * PresentationResolver — Resolución de Clases de Presentación (E12)
 */

'use strict';

const PRESENTATION_MAP = Object.freeze({
    P01_BODY_BASE: 'cuerpo-siguiente',
    P01_BODY_CONT: 'cuerpo-siguiente',
    P07_INDENT_L1: 'sangria-n1',
    P02_TITLE_MAIN: 'p02-title-main',
    P02_TITLE_PART: 'titulo_parte',
    P02_TITLE_CHAPTER: 'titulo',
    P03_CENTER_BOLD: 'texto-centrado-bold'
});

class PresentationResolver {
    resolve(nodo) {
        if (!nodo || typeof nodo !== 'object') return null;
        const estilo = nodo.inDesignStyle || nodo.estiloParrafo || nodo.estilo || '';
        if (!estilo) return null;
        return PRESENTATION_MAP[estilo] || null;
    }
}

module.exports = {
    PresentationResolver,
    PRESENTATION_MAP
};