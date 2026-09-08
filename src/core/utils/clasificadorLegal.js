/**
 * core/clasificadorLegal.js
 * Cerebro jurídico modular que utiliza el motor de expresiones GREP.
 */
const { evaluarTokenConGrep } = require('./motorGrepJuridico');

function reclasificarNodo(token) {
    const texto = token.texto_limpio || token.texto_completo || '';
    
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
    let tokensLimpios = tokens.filter((t, i) => 
        !(i > 0 && t.tipo === 'titulo' && t.texto_limpio === tokens[0].texto_limpio)
    );

    // 2. Mapeo estructural masivo mediante GREP
    return tokensLimpios.map(reclasificarNodo);
}

module.exports = {
    aplicarReglasJuridicas
};