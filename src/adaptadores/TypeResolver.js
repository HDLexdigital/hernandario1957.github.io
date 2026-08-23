const TIPO_BASE_MAP = {
    'TerminoGlosario': 'texto',
    'P01_BODY_CONT': 'parrafo',
    'P01_BODY_BASE': 'parrafo',
    'P07_INDENT_L1': 'parrafo',
    '00 Normal_char': 'texto',
    'P02_TITLE_MAIN': 'parrafo',
    'P02_TITLE_CHAPTER': 'parrafo',
    'P02_TITLE_PART': 'parrafo',
    'P03_CENTER_BOLD': 'parrafo',
    'C16_TD_GLOSS': 'texto'
};

function inferirTipo(estilo) {
    if (!estilo || typeof estilo !== 'string') return null;
    return TIPO_BASE_MAP[estilo] || null;
}

module.exports = {
    inferirTipo,
    resolverTipoBase: inferirTipo, // <-- El alias ontológico para proteger compilarLexmotor
    TIPO_BASE_MAP
};