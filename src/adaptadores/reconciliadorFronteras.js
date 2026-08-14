'use strict';

/**
 * Módulo puro e inmutable para la reconciliación de fronteras entre
 * fragmentos hijos utilizando el texto canónico del contenedor padre
 * como fuente de verdad absoluta.
 */

function reconciliarFronterasFragmentos(nodo) {
    if (!nodo || typeof nodo !== 'object') {
        return nodo;
    }

    const nodoClonado = {
        ...nodo
    };

    if (!Array.isArray(nodoClonado.contenido)) {
        return nodoClonado;
    }

    if (nodoClonado.contenido.length <= 1) {
        nodoClonado.contenido =
            nodoClonado.contenido.map(hijo => ({
                ...hijo
            }));

        return nodoClonado;
    }

    const textoPadre =
        typeof nodoClonado.texto === 'string'
            ? nodoClonado.texto
            : '';

    const hijosClonados =
        nodoClonado.contenido.map(hijo => ({
            ...hijo
        }));

    if (!textoPadre) {
        nodoClonado.contenido = hijosClonados;
        return nodoClonado;
    }

    function fronteraSinSeparador(textoIzquierdo, textoDerecho) {
        if (!textoIzquierdo || !textoDerecho) {
            return false;
        }

        const terminaConSeparador =
            /[\s\u00A0]$/.test(textoIzquierdo);

        const comienzaConSeparador =
            /^[\s\u00A0]/.test(textoDerecho);

        return !terminaConSeparador &&
               !comienzaConSeparador;
    }

    function detectarSeparador(textoIzquierdo, textoDerecho) {
        if (!fronteraSinSeparador(
            textoIzquierdo,
            textoDerecho
        )) {
            return null;
        }

        const unionEspacio =
            textoIzquierdo +
            ' ' +
            textoDerecho;

        if (textoPadre.includes(unionEspacio)) {
            return ' ';
        }

        const unionNbsp =
            textoIzquierdo +
            '\u00A0' +
            textoDerecho;

        if (textoPadre.includes(unionNbsp)) {
            return '\u00A0';
        }

        const padreNorm =
            textoPadre.replace(/\s+/g, ' ');

        const izquierdoNorm =
            textoIzquierdo.trim();

        const derechoNorm =
            textoDerecho.trim();

        if (!izquierdoNorm || !derechoNorm) {
            return null;
        }

        const unionNorm =
            izquierdoNorm +
            ' ' +
            derechoNorm;

        if (padreNorm.includes(unionNorm)) {
            return ' ';
        }

        return null;
    }

    for (
        let i = 0;
        i < hijosClonados.length - 1;
        i++
    ) {
        const actual = hijosClonados[i];
        const siguiente = hijosClonados[i + 1];

        const textoActual =
            typeof actual.texto === 'string'
                ? actual.texto
                : '';

        const textoSiguiente =
            typeof siguiente.texto === 'string'
                ? siguiente.texto
                : '';

        if (!textoActual || !textoSiguiente) {
            continue;
        }

        const separador =
            detectarSeparador(
                textoActual,
                textoSiguiente
            );

        if (separador !== null) {
            hijosClonados[i] = {
                ...actual,
                texto:
                    textoActual +
                    separador
            };
        }
    }

    let posicionPadre = 0;

    for (let i = 0; i < hijosClonados.length; i++) {
        const hijo = hijosClonados[i];

        const textoHijo =
            typeof hijo.texto === 'string'
                ? hijo.texto
                : '';

        if (!textoHijo) {
            continue;
        }

        if (posicionPadre >= textoPadre.length) {
            hijosClonados[i] = {
                ...hijo,
                texto: ''
            };

            continue;
        }

        const restantePadre =
            textoPadre.slice(posicionPadre);

        if (restantePadre.startsWith(textoHijo)) {
            posicionPadre += textoHijo.length;
            continue;
        }

        let longitudValida = 0;

        const limite = Math.min(
            textoHijo.length,
            restantePadre.length
        );

        while (
            longitudValida < limite &&
            textoHijo[longitudValida] ===
                restantePadre[longitudValida]
        ) {
            longitudValida++;
        }

        if (longitudValida > 0) {
            const textoValido =
                textoHijo.slice(
                    0,
                    longitudValida
                );

            hijosClonados[i] = {
                ...hijo,
                texto: textoValido
            };

            posicionPadre += longitudValida;

            continue;
        }

        if (
            restantePadre.startsWith(' ') &&
            textoHijo === restantePadre.slice(1)
        ) {
            hijosClonados[i] = {
                ...hijo,
                texto: ' ' + textoHijo
            };

            posicionPadre += textoHijo.length + 1;

            continue;
        }

        if (
            restantePadre.startsWith('\u00A0') &&
            textoHijo === restantePadre.slice(1)
        ) {
            hijosClonados[i] = {
                ...hijo,
                texto: '\u00A0' + textoHijo
            };

            posicionPadre += textoHijo.length + 1;

            continue;
        }

        hijosClonados[i] = {
            ...hijo,
            texto: ''
        };
    }

    let reconstruido =
        hijosClonados
            .map(hijo => hijo.texto || '')
            .join('');

    if (reconstruido !== textoPadre) {
        let exceso =
            reconstruido.length -
            textoPadre.length;

        if (exceso > 0) {
            for (
                let i = hijosClonados.length - 1;
                i >= 0 && exceso > 0;
                i--
            ) {
                const texto =
                    typeof hijosClonados[i].texto === 'string'
                        ? hijosClonados[i].texto
                        : '';

                if (!texto) {
                    continue;
                }

                const eliminar =
                    Math.min(
                        exceso,
                        texto.length
                    );

                hijosClonados[i] = {
                    ...hijosClonados[i],
                    texto:
                        texto.slice(
                            0,
                            texto.length - eliminar
                        )
                };

                exceso -= eliminar;
            }
        } else if (exceso < 0) {
            const faltante = -exceso;
            for (
                let i = hijosClonados.length - 1;
                i >= 0;
                i--
            ) {
                const texto =
                    typeof hijosClonados[i].texto === 'string'
                        ? hijosClonados[i].texto
                        : '';

                if (texto.length > 0 || i === hijosClonados.length - 1) {
                    hijosClonados[i] = {
                        ...hijosClonados[i],
                        texto:
                            texto +
                            textoPadre.slice(
                                textoPadre.length - faltante
                            )
                    };
                    break;
                }
            }
        }
    }

    nodoClonado.contenido = hijosClonados;

    return nodoClonado;
}

module.exports = {
    reconciliarFronterasFragmentos
};