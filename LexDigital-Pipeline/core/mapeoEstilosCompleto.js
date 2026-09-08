'use strict';
/**
 * MAPEO COMPLETO DE ESTILOS INDESIGN → CSS
 * Cada estilo de párrafo/carácter con su configuración exacta
 */
const MAPEO_ESTILOS = {
    // === TÍTULOS ===
    'P02_TITLE_BASE': {
        fontFamily: "'Georgia Pro', sans-serif",
        fontWeight: 'bold',
        fontSize: '24pt',
        textTransform: 'uppercase',
        letterSpacing: '0.9em',
        textAlign: 'center',
        marginLeft: '2mm',
        marginTop: '5mm',
        marginBottom: '1mm',
        borderBottom: '2pt dotted',
        backgroundColor: 'Azul Borgona',
        paddingTop: '2mm',
        paddingBottom: '1mm'
    },
    'P02_TITLE_MAIN': {
        fontFamily: "'Georgia Pro', sans-serif",
        fontWeight: 'bold',
        fontSize: '16pt',
        textTransform: 'uppercase',
        letterSpacing: '0.9em',
        color: 'TITULO Constitucion',
        textAlign: 'center',
        marginTop: '5mm',
        marginBottom: '1mm',
        borderBottom: '2pt dotted',
        backgroundColor: 'Sombra_Titulo'
    },
    'P02_TITLE_CHAPTER': {
        fontFamily: "'Liberation Serif', sans-serif",
        fontWeight: 'bold',
        fontSize: '14pt',
        color: 'Capitulo Constitucion',
        textAlign: 'center',
        lineHeight: '1.35',
        marginTop: '4mm',
        borderBottom: '2pt dotted'
    },
    'P02_TITLE_PART': {
        fontFamily: "'Georgia Pro', sans-serif",
        fontWeight: 'bold',
        fontSize: '24pt',
        textTransform: 'uppercase',
        textAlign: 'center',
        marginTop: '5mm',
        marginBottom: '1mm'
    },
    // === CUERPO ===
    'P01_BODY_BASE': {
        fontFamily: "'Liberation Serif', sans-serif",
        fontSize: '14pt',
        letterSpacing: '0.008em',
        textAlign: 'justify',
        textAlignLast: 'left',
        lineHeight: '1.35',
        marginTop: '3.5mm',
        hyphens: 'auto'
    },
    'P01_BODY_CONT': {
        fontFamily: "'Liberation Serif', sans-serif",
        fontSize: '14pt',
        textAlign: 'justify',
        textAlignLast: 'left',
        lineHeight: '1.35',
        textIndent: '0.5em',
        hyphens: 'auto'
    },
    // === SANGRÍAS ===
    'P07_INDENT_L1': {
        fontFamily: "'Liberation Serif', sans-serif",
        fontSize: '14pt',
        textAlign: 'justify',
        lineHeight: '1.35',
        marginLeft: '1.117em',
        textIndent: '-0.647em'
    },
    // === CENTRADOS ===
    'P03_CENTER_BOLD': {
        fontFamily: "'Liberation Serif', sans-serif",
        fontWeight: 'bold',
        fontSize: '14pt',
        textAlign: 'center'
    }
};
/**
 * Genera CSS desde el mapeo exacto
 */
function generarCSSExacto(estilosUsados) {
    let css = '/* CSS LEXTILOS - CONFIGURACIÓN EXACTA INDESIGN */\n\n';
    const estilos = estilosUsados || Object.keys(MAPEO_ESTILOS);
    for (const estilo of estilos) {
        const props = MAPEO_ESTILOS[estilo];
        if (!props) continue;
        css += '.' + estilo + ' {\n';
        for (const [propiedad, valor] of Object.entries(props)) {
            // Convertir camelCase a kebab-case
            const propCSS = propiedad.replace(/([A-Z])/g, '-$1').toLowerCase();
            css += '  ' + propCSS + ': ' + valor + ';\n';
        }
        css += '}\n\n';
    }
    return css;
}
module.exports = { MAPEO_ESTILOS, generarCSSExacto };