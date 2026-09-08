/**
 * @fileoverview
 * Validador estructural del campo "contenido"
 * para el pipeline LexDigital.
 *
 * Contrato:
 *
 * PIPE-CONTRACT-003-A
 * - "contenido" debe existir.
 * - "contenido" debe ser un arreglo.
 *
 * PIPE-CONTRACT-003-B
 * - Cada elemento de "contenido" debe ser un objeto.
 *
 * PIPE-CONTRACT-003-C
 * - Cada nodo debe declarar la propiedad "tipo".
 * - Cada nodo debe declarar la propiedad "texto".
 *
 * PIPE-CONTRACT-003-D
 * - "tipo" debe ser un string.
 * - "texto" debe ser un string.
 *
 * PIPE-CONTRACT-003-E1
 * - "tipo" no puede ser una cadena vacía.
 * - "tipo" no puede estar compuesto únicamente por espacios.
 *
 * PIPE-CONTRACT-003-E2
 * - "tipo" debe pertenecer al vocabulario controlado.
 *
 * PIPE-CONTRACT-003-F
 * - "texto" no puede ser una cadena vacía.
 * - "texto" no puede estar compuesto únicamente por espacios.
 */

/**
 * Vocabulario controlado de tipos de nodo.
 *
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


/**
 * Valida la colección "contenido" de un documento LexDigital.
 *
 * @param {Object} jsonCrudo
 * @throws {TypeError} Cuando la estructura no cumple el contrato.
 * @throws {Error} Cuando el contenido textual está vacío.
 */
function validarContenido(jsonCrudo) {

    /*
     * ============================================================
     * PIPE-CONTRACT-003-A
     * Existencia y tipo de la colección
     * ============================================================
     */

    if (
        !Object.prototype.hasOwnProperty.call(
            jsonCrudo,
            'contenido'
        )
    ) {
        throw new TypeError(
            'falta colección requerida "contenido"'
        );
    }

    if (!Array.isArray(jsonCrudo.contenido)) {
        throw new TypeError(
            '"contenido" debe ser un arreglo'
        );
    }


    /*
     * ============================================================
     * PIPE-CONTRACT-003-B
     * Integridad de los nodos
     * ============================================================
     */

    jsonCrudo.contenido.forEach((nodo) => {

        if (
            nodo === null ||
            typeof nodo !== 'object' ||
            Array.isArray(nodo)
        ) {
            throw new TypeError(
                'cada elemento de "contenido" debe ser un objeto'
            );
        }


        /*
         * ========================================================
         * PIPE-CONTRACT-003-C
         * Existencia de identidad y cuerpo del nodo
         * ========================================================
         */

        if (
            !Object.prototype.hasOwnProperty.call(
                nodo,
                'tipo'
            )
        ) {
            throw new TypeError(
                'cada elemento de "contenido" debe incluir la propiedad "tipo"'
            );
        }

        if (
            !Object.prototype.hasOwnProperty.call(
                nodo,
                'texto'
            )
        ) {
            throw new TypeError(
                'cada elemento de "contenido" debe incluir la propiedad "texto"'
            );
        }


        /*
         * ========================================================
         * PIPE-CONTRACT-003-D
         * Tipo de dato de "tipo" y "texto"
         * ========================================================
         */

        if (typeof nodo.tipo !== 'string') {
            throw new TypeError(
                'la propiedad "tipo" de cada elemento de "contenido" debe ser un string'
            );
        }

        if (typeof nodo.texto !== 'string') {
            throw new TypeError(
                'la propiedad "texto" de cada elemento de "contenido" debe ser un string'
            );
        }


        /*
         * ========================================================
         * PIPE-CONTRACT-003-E1
         * Dominio semántico de "tipo"
         *
         * Un string vacío o compuesto únicamente por espacios
         * no constituye una identidad semántica válida.
         * ========================================================
         */

        if (nodo.tipo.trim() === '') {
            throw new TypeError(
                'la propiedad "tipo" de cada elemento de "contenido" no puede estar vacía'
            );
        }


        /*
         * ========================================================
         * PIPE-CONTRACT-003-E2
         * Vocabulario controlado de "tipo"
         * ========================================================
         */

        if (!TIPOS_VALIDOS.has(nodo.tipo)) {
            throw new TypeError(
                `tipo no reconocido o inválido: "${nodo.tipo}"`
            );
        }


        /*
         * ========================================================
         * PIPE-CONTRACT-003-F
         * Semántica del contenido textual
         *
         * Una cadena vacía o compuesta únicamente por espacios
         * no constituye contenido textual válido.
         * ========================================================
         */

        if (nodo.texto.trim() === '') {
            throw new Error(
                'la propiedad "texto" de cada elemento de "contenido" no puede estar vacía'
            );
        }

    });
}


module.exports = {
    validarContenido
};