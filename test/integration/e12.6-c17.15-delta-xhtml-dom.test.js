'use strict';

const path = require('path');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');
const { constructorXHTML } = require('../../src/constructores/constructorXHTML');

describe('E12.6-C.17.15 — Auditoría del Delta entre String XHTML RAW y el DOM Parseado', () => {

    test('Compara cuantitativamente la cardinalidad de etiquetas <p> antes y después del parsing JSDOM', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        // 1. Ingestión, Adaptación e Inyección Universal de __traceId (1117 nodos)
        const adaptado = adaptarInDesign({ jsonCrudo });
        let nodosAdaptados = adaptado.ast.contenido || adaptado.ast;

        let contadorAst = 0;
        const inyectarTraceUniversal = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;
            contadorAst++;
            nodo.__traceId = `ast-${String(contadorAst).padStart(4, '0')}`;

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(inyectarTraceUniversal);
            }
        };

        if (Array.isArray(nodosAdaptados)) {
            nodosAdaptados.forEach(inyectarTraceUniversal);
        } else {
            inyectarTraceUniversal(nodosAdaptados);
        }

        // 2. Compilación y Generación del XHTML Bruto (RAW String)
        const resultadoCompilacion = compilarLexmotor(adaptado.ast);
        const xhtmlBruto = constructorXHTML(resultadoCompilacion.ast.contenido);

        // 3. Análisis Métrico en la Capa A: String XHTML RAW (antes del parsing)
        // Contamos ocurrencias exactas de etiquetas mediante expresiones regulares seguras
        const matchesTagOpenP = xhtmlBruto.match(/<p\b[^>]*>/gi) || [];
        const matchesTagCloseP = xhtmlBruto.match(/<\/p>/gi) || [];
        const matchesEmptyP = xhtmlBruto.match(/<p\b[^>]*>\s*<\/p>/gi) || [];

        // 4. Transformación / Parsing en Capa B: JSDOM (DOM Final)
        const dom = new JSDOM(xhtmlBruto);
        const document = dom.window.document;
        const elementosPDom = Array.from(document.querySelectorAll('p'));
        
        let domVaciosAnonimos = 0;
        elementosPDom.forEach(p => {
            if (!p.hasAttribute('data-trace') && p.innerHTML.trim() === '') {
                domVaciosAnonimos++;
            }
        });

        // 5. Informe de Delta Causal en Consola
        console.log('\n====================================================================');
        console.log('   E12.6-C.17.15 — INFORME DE DELTA STRING XHTML RAW ➔ DOM');
        console.log('====================================================================');
        console.log(`   [CAPA A - STRING XHTML RAW]:`);
        console.log(`     - Etiquetas de apertura <p>     : ${matchesTagOpenP.length}`);
        console.log(`     - Etiquetas de cierre </p>      : ${matchesTagCloseP.length}`);
        console.log(`     - Patrones explícitos <p></p>   : ${matchesEmptyP.length}`);
        console.log('--------------------------------------------------------------------');
        console.log(`   [CAPA B - DOM PARSEADO (JSDOM)]:`);
        console.log(`     - Total elementos <p> en DOM    : ${elementosPDom.length}`);
        console.log(`     - Elementos <p> sin traceId vacíos: ${domVaciosAnonimos}`);
        console.log('--------------------------------------------------------------------');
        console.log(`   [DELTA CALCULADO (DOM - RAW)]:`);
        console.log(`     - Diferencia de conteo <p>      : ${elementosPDom.length - matchesTagOpenP.length}`);
        console.log('====================================================================\n');

        expect(contadorAst).toBe(1117);
        expect(xhtmlBruto.length).toBeGreaterThan(0);
        expect(elementosPDom.length).toBe(1325);
    });

});