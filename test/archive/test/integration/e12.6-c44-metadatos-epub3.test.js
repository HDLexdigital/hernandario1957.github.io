'use strict';

const { JSDOM } = require('jsdom');
const { ensamblarDocumentoXHTML } = require('../../src/constructores/ensambladorDocumento');

describe('E12.6-C.44 — Contrato de Metadatos y Estructura Head EPUB3', () => {

    test('El ensamblador debe inyectar título dinámico, charset UTF-8 y enlace CSS', () => {
        // 1. Datos de entrada que simulan el pipeline (C.44 exige estos parámetros)
        const fragmentoFalso = '<p>Contenido de prueba</p>';
        const opciones = {
            title: 'Constitución Política de Colombia',
            cssName: 'estilos-ley.css',
            lang: 'es-CO'
        };

        // 2. Ejecución (la firma actual ignorará 'opciones', provocando el RED)
        const xhtmlDocumento = ensamblarDocumentoXHTML(fragmentoFalso, opciones);

        // 3. Parseo XML
        const dom = new JSDOM(xhtmlDocumento, { contentType: 'application/xhtml+xml' });
        const doc = dom.window.document;

        // 4. Asertos (Criterios de Aceptación C.44)
        
        // A. Título dinámico
        const titleEl = doc.querySelector('title');
        expect(titleEl).not.toBeNull();
        expect(titleEl.textContent).toBe(opciones.title); // Fallará: será 'LexDigital Document'

        // B. Charset UTF-8
        const metaCharset = doc.querySelector('meta[charset="utf-8"]');
        expect(metaCharset).not.toBeNull(); // Fallará: será null

        // C. Enlace a CSS
        const cssLink = doc.querySelector('link[rel="stylesheet"]');
        expect(cssLink).not.toBeNull(); // Fallará: será null
        expect(cssLink.getAttribute('href')).toBe(opciones.cssName); // Lo comprobaremos cuando deje de ser null
    });

});