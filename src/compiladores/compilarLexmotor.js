/**
 * Compilador Lexmotor (E12) - Compilación Determinista y Segura (C.17.5)
 */

'use strict';

const { resolverTipoBase } = require('../adaptadores/TypeResolver');
const { PresentationResolver } = require('../resolucion/PresentationResolver');
const { resolveStyleName } = require('../adaptadores/SemanticResolver');

function compilarLexmotor(ast) {
    if (!ast) return { ast: null };

    const astNormalizado = JSON.parse(JSON.stringify(ast));
    const presentationResolver = new PresentationResolver();

    // Frontera rigurosa: Nodos con identidad editorial de párrafo
    function esNodoParrafo(nodo) {
        return nodo && typeof nodo === 'object' && nodo.tipoNodo === 'paragraph';
    }

    // Frontera rigurosa: Nodos con identidad editorial de carácter (inline)
    function esNodoCaracter(nodo) {
        return nodo && typeof nodo === 'object' && nodo.tipoNodo === 'character';
    }

    function resolverParrafo(nodo) {
        const estilo = (nodo.inDesignStyle || nodo.estiloParrafo || nodo.estilo || '').trim();
        if (!estilo || estilo === '[Ninguno]') return;

        const semClass = resolverTipoBase(estilo);
        const presClass = presentationResolver.resolve(nodo);

        nodo.claseSemantica = semClass;
        nodo.claseLegal = semClass;

        if (presClass) {
            nodo.resolvedClass = `${presClass} ${semClass}`.trim();
        } else {
            nodo.resolvedClass = semClass;
        }

        nodo.resolvedTag = 'p';
    }

function resolverCaracter(nodo) {
        const estilo = (nodo.inDesignStyle || nodo.estiloCaracter || '').trim();

        // Todo nodo character por contrato E12 debe representarse como span inline de forma incondicional
        nodo.resolvedTag = 'span';

        if (!estilo || estilo === '[Ninguno]' || estilo === 'None') {
            nodo.resolvedClass = null;
            return;
        }

        const resuelto = resolveStyleName(estilo, true, {}, {});
        nodo.resolvedClass = resuelto.resolvedClass || null;
    }

    function procesarNodo(nodo) {
        if (!nodo || typeof nodo !== 'object') return;

        if (esNodoParrafo(nodo)) {
            resolverParrafo(nodo);
        } else if (esNodoCaracter(nodo)) {
            resolverCaracter(nodo);
        }

        // Descenso recursivo seguro para todos los nodos hijos
        if (Array.isArray(nodo.contenido)) {
            nodo.contenido.forEach(procesarNodo);
        }
    }

    if (Array.isArray(astNormalizado.contenido)) {
        astNormalizado.contenido.forEach(procesarNodo);
    } else if (Array.isArray(astNormalizado)) {
        astNormalizado.forEach(procesarNodo);
    } else {
        procesarNodo(astNormalizado);
    }

    return {
        ast: astNormalizado
    };
}

module.exports = { compilarLexmotor };