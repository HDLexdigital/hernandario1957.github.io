'use strict';

const path = require('path');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');
const { constructorXHTML } = require('../../src/constructores/constructorXHTML');

describe('E12.6-C.17.16 — Autopsia Forense RAW ➔ DOM y Prueba de Parser', () => {

    test('Compara el comportamiento del parser HTML frente al parser estricto XHTML y localiza la primera divergencia', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        // 1. Ingestión, Adaptación y Generación del XHTML RAW
        const adaptado = adaptarInDesign({ jsonCrudo });
        const resultadoCompilacion = compilarLexmotor(adaptado.ast);
        const xhtmlBruto = constructorXHTML(resultadoCompilacion.ast.contenido);

        // 2. Parseo Modo HTML (JSDOM por defecto)
        const domHtml = new JSDOM(xhtmlBruto);
        const psHtml = Array.from(domHtml.window.document.querySelectorAll('p'));

        // 3. Parseo Modo XHTML Estricto nativo en JSDOM
        let psXmlCount = 0;
        try {
            const domXml = new JSDOM(xhtmlBruto, { contentType: 'application/xhtml+xml' });
            psXmlCount = domXml.window.document.querySelectorAll('p').length;
        } catch (e) {
            psXmlCount = `FALLO_VALIDACION_XML: ${e.message}`;
        }

        // 4. Búsqueda de la primera divergencia / aparición de <p></p> anónimo en el DOM HTML
        let primeraDivergenciaIndex = -1;
        let snippetContextoRaw = '';

        psHtml.forEach((p, idx) => {
            const hasTrace = p.hasAttribute('data-trace');
            const isEmpty = p.innerHTML.trim() === '';
            if (!hasTrace && isEmpty && primeraDivergenciaIndex === -1) {
                primeraDivergenciaIndex = idx;
                const prev = p.previousElementSibling;
                const next = p.nextElementSibling;
                snippetContextoRaw = `Prev: [${prev ? prev.outerHTML.substring(0, 40) : 'START'}] | Next: [${next ? next.outerHTML.substring(0, 40) : 'END'}]`;
            }
        });

        // 5. Informe de Autopsia en Consola
        console.log('\n====================================================================');
        console.log('   E12.6-C.17.16 — INFORME DE AUTOPSIA PARSER RAW ➔ DOM');
        console.log('====================================================================');
        console.log(`   Total elementos <p> en JSDOM (HTML Parser) : ${psHtml.length}`);
        console.log(`   Total elementos <p> en JSDOM (XML Parser)  : ${psXmlCount}`);
        console.log('--------------------------------------------------------------------');
        console.log(`   Primera divergencia anónima en índice DOM  : ${primeraDivergenciaIndex}`);
        console.log(`   Contexto estructural de la divergencia     : ${snippetContextoRaw}`);
        console.log('====================================================================\n');

        expect(xhtmlBruto).toBeDefined();
        expect(psHtml.length).toBe(1325);
    });

});