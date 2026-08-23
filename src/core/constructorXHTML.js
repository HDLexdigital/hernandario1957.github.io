const {
    escaparHTML,
    normalizarClase
} = require('../utils/textUtils');

const {
    purgarCSSInDesign
} = require('../utils/cssPurifier');

function construirEstructura(
    tokensEntrada,
    documentoEntrada,
    nombreCSS = 'Lexdigital_Modular.css',
    cssCrudoOriginal = ''
) {
    // Blindaje absoluto: Maneja tanto si entra un arreglo directo como un objeto AST/Estructurado
    let tokens = [];
    let documento = documentoEntrada || { titulo: "Documento Jurídico" };

    if (Array.isArray(tokensEntrada)) {
        tokens = tokensEntrada;
    } else if (tokensEntrada && typeof tokensEntrada === 'object') {
        if (tokensEntrada.documento) {
            documento = tokensEntrada.documento;
        }
        if (Array.isArray(tokensEntrada.tokens)) {
            tokens = tokensEntrada.tokens;
        } else if (Array.isArray(tokensEntrada.contenido)) {
            tokens = tokensEntrada.contenido;
        }
    }

    const titulo = documento.titulo || "Documento Jurídico";

    const cssDepurado = cssCrudoOriginal
        ? purgarCSSInDesign(cssCrudoOriginal)
        : '';

    let html = `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="es" lang="es">
<head>
    <meta charset="utf-8" />
    <title>${escaparHTML(titulo)}</title>
`;

    if (cssDepurado) {
        html += `    <style>
${cssDepurado}
    </style>
`;
    } else {
        html += `    <link rel="stylesheet" href="${escaparHTML(nombreCSS)}" />
`;
    }

    html += `</head>
<body role="document">
    <header role="banner">
        <h1 role="heading" aria-level="1">${escaparHTML(titulo)}</h1>
    </header>
    <main role="main" aria-label="Contenido principal del documento jurídico">
        <article role="article">
`;

    tokens.forEach((token) => {
        const texto = escaparHTML(token.texto || '');
        const clase = normalizarClase(
            token.claseLegal || token.tipo || 'parrafo'
        );

        let etiqueta = 'p';
        let atributos = '';

        switch (token.tipo) {
            case 'preliminar_portada':
            case 'preliminar_legal':
            case 'preliminar_indice':
            case 'preliminar_prologo':
                etiqueta = 'section';
                atributos = ' role="doc-preface"';
                break;

            case 'libro':
            case 'titulo_parte':
            case 'capitulo':
            case 'seccion':
                etiqueta = 'h2';
                atributos = ' role="heading" aria-level="2"';
                break;

            case 'articulo':
                etiqueta = 'p';
                atributos = ' role="doc-section"';
                break;

            case 'paragrafo_normativo':
            case 'inciso':
            case 'texto_cuerpo':
            case 'parrafo':
            case 'glosario_titulo':
            default:
                etiqueta = 'p';
                break;
        }

        html += `            <${etiqueta} class="${clase}"${atributos}>${texto}</${etiqueta}>
`;
    });

    html += `        </article>
    </main>
</body>
</html>`;

    return html;
}

module.exports = {
    construirEstructura
};