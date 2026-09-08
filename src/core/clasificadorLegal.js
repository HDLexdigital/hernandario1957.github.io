/**
 * core/clasificadorLegal.js
 * Cerebro jurídico modular que utiliza el motor de expresiones GREP.
 */

const {
    evaluarTokenConGrep
} = require('./motorGrepJuridico');

function reclasificarNodo(token) {
    // ÚNICA FUENTE DE VERDAD: usamos token.texto
    const texto = token.texto;

    // Evaluamos el nodo utilizando las expresiones GREP editoriales
    const resultadoGrep = evaluarTokenConGrep(texto);

    return {
        ...token,
        tipo: resultadoGrep.tipo,
        epubType: resultadoGrep.epubType,
        nivelHtml: resultadoGrep.nivelHtml
    };
}

function aplicarReglasJuridicas(tokens) {
    // 1. Depuración inicial de artefactos repetidos
    const tokensLimpios = tokens.filter(
        (t, i) =>
            !(
                i > 0 &&
                t.tipo === 'titulo' &&
                t.texto === tokens[0].texto // <-- Comparación purificada
            )
    );

    // 2. Mapeo estructural mediante GREP
    return tokensLimpios.map(reclasificarNodo);
}

module.exports = {
    aplicarReglasJuridicas
};