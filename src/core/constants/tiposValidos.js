'use strict';

/**
 * Vocabulario controlado unificado de tipos de nodo para el pipeline Lexmotor.
 * @type {Set<string>}
 */
const TIPOS_VALIDOS = new Set([
    'preliminar_portada',
    'preliminar_legal',
    'preliminar_indice',
    'preliminar_prologo',
    'libro',
    'titulo_parte',
    'capitulo',
    'seccion',
    'articulo',
    'paragrafo_normativo',
    'inciso',
    'glosario_titulo',
    'texto_cuerpo',
    'parrafo'
]);

module.exports = { TIPOS_VALIDOS };