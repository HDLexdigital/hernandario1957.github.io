const {
    escaparHTML,
    normalizarClase
} = require('../utils/textUtils');

const {
    purgarCSSInDesign
} = require('../utils/cssPurifier');

function construirEstructura(
    tokens,
    documento,
    nombreCSS = 'Lexdigital_Modular.css',
    cssCrudoOriginal = ''
) {
    const titulo = documento.titulo;

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
        // Única Fuente de Verdad para el texto (alias eliminados)
        const texto = escaparHTML(token.texto);
        
        // Confiamos en la semántica del clasificador
        const clase = normalizarClase(
            token.claseLegal || token.tipo
        );

        let etiqueta = 'p';
        let atributos = '';

        // El switch reacciona al contrato canónico, no a expresiones regulares locales
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