'use strict';
const TIPO_BASE_MAP = {
    // === CONSTITUCIÓN ===
    'P02_TITLE_MAIN': 'titulo',
    'P02_TITLE_CHAPTER': 'capitulo',
    'P02_TITLE_PART': 'parte',
    'P03_CENTER_BOLD': 'titulo_centrado',
    'P01_BODY_BASE': 'articulo',
    'P01_BODY_CONT': 'parrafo',
    'P07_INDENT_L1': 'parrafo_sangria',
    'TerminoGlosario': 'texto',
    'C16_TD_GLOSS': 'texto_glosario',
    '00 Normal_char': 'texto',
    // === DECRETO 252 / CÓDIGO DE TRABAJO ===
    '2.1 Titulo': 'titulo',
    '2.2 Capitulo': 'capitulo',
    '2.3 Seccion': 'seccion',
    '2.4 Libro': 'libro',
    '2.5 Subtitulo Libro': 'subtitulo',
    '2.6 Texto_Adopta_Por_la_cual': 'texto_adopcion',
    '1 Cuerpo de texto PORTO': 'parrafo',
    '1.1 Cuerpo de texto siguiente': 'parrafo',
    '4.5 titulo Libro Articulos': 'titulo',
    '4.6 Título Articulos': 'titulo',
    '4.7 Capítulo Articulos': 'capitulo',
    '4.8 Sección Articulo': 'seccion',
    '4.1 Indice Artículos + 10': 'indice',
    '4.2 Indice Articulos + 100': 'indice',
    '4.4 Indice Artículos + 1000': 'indice',
    '3.1 Indice_Nivel 00': 'indice',
    '3.2 Contenido_N1 Titulo': 'titulo',
    '[Ningún estilo de párrafo]': 'parrafo',
    '[Párrafo básico]': 'parrafo'
};
function inferirTipo(estilo) {
    if (!estilo || typeof estilo !== 'string') return null;
    return TIPO_BASE_MAP[estilo] || null;
}
// Mapeo de tipo semántico a etiqueta HTML
function tipoAEtiqueta(tipo) {
    const mapeo = {
        'titulo': 'h1',
        'capitulo': 'h2',
        'seccion': 'h3',
        'libro': 'h2',
        'subtitulo': 'h2',
        'articulo': 'p',
        'parrafo': 'p',
        'texto': 'span',
        'indice': 'p'
    };
    return mapeo[tipo] || 'p';
}
module.exports = {
    inferirTipo,
    resolverTipoBase: inferirTipo,
    tipoAEtiqueta,
    TIPO_BASE_MAP
};