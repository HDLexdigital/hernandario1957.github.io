'use strict';

const { reconciliarFronterasFragmentos } = require('../../src/adaptadores/reconciliadorFronteras');

describe('Unidad: reconciliadorFronteras.js — Contrato de Reconciliación Pura e Inmutable', () => {

    test('Invariante: No muta el nodo original ni sus objetos hijos de entrada (inmutabilidad estricta)', () => {
        const nodoOriginal = {
            inDesignStyle: 'P01_BODY_BASE',
            texto: 'Artículo 3. La soberanía reside exclusivamente',
            contenido: [
                { texto: 'Artículo 3. La', estilo: 'bold' },
                { texto: 'soberanía', estilo: 'normal' },
                { texto: 'reside exclusivamente', estilo: 'normal' }
            ]
        };

        const copiaAntes = JSON.parse(JSON.stringify(nodoOriginal));
        const nodoResultado = reconciliarFronterasFragmentos(nodoOriginal);
        const copiaDespues = JSON.parse(JSON.stringify(nodoOriginal));

        expect(copiaDespues).toEqual(copiaAntes);
        expect(nodoResultado).not.toBe(nodoOriginal);
        expect(nodoResultado.contenido).not.toBe(nodoOriginal.contenido);
        expect(nodoResultado.contenido[0]).not.toBe(nodoOriginal.contenido[0]);
    });

    test('Reconciliación de espacio semántico faltante (A + " " + B)', () => {
        const nodoEntrada = {
            texto: 'Artículo 3. La soberanía reside',
            contenido: [
                { texto: 'Artículo 3. La' },
                { texto: 'soberanía' },
                { texto: 'reside' }
            ]
        };

        const resultado = reconciliarFronterasFragmentos(nodoEntrada);

        // El separador se adhiere deterministamente al fragmento izquierdo de cada frontera
        expect(resultado.contenido[0].texto).toBe('Artículo 3. La ');
        expect(resultado.contenido[1].texto).toBe('soberanía ');
        expect(resultado.contenido[2].texto).toBe('reside');
        
        const textoConcatenado = resultado.contenido.map(h => h.texto).join('');
        expect(textoConcatenado).toBe(nodoEntrada.texto);
    });

    test('Preservación de unión legítima sin espacio (A + B)', () => {
        const nodoEntrada = {
            texto: 'La Constitución política',
            contenido: [
                { texto: 'La Consti' },
                { texto: 'tución' },
                { texto: ' política' }
            ]
        };

        const resultado = reconciliarFronterasFragmentos(nodoEntrada);

        expect(resultado.contenido[0].texto).toBe('La Consti');
        expect(resultado.contenido[1].texto).toBe('tución');
        expect(resultado.contenido[2].texto).toBe(' política');
        
        const textoConcatenado = resultado.contenido.map(h => h.texto).join('');
        expect(textoConcatenado).toBe(nodoEntrada.texto);
    });

    test('Determinismo y robustez ante contenedores con un solo hijo o sin contenido', () => {
        const nodoSimple = {
            texto: 'Título Único',
            contenido: [
                { texto: 'Título Único' }
            ]
        };

        const resultado = reconciliarFronterasFragmentos(nodoSimple);
        expect(resultado.contenido.length).toBe(1);
        expect(resultado.contenido[0].texto).toBe('Título Único');
    });

});