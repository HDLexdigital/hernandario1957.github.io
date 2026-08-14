'use strict';

const path = require('path');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');
const { constructorXHTML } = require('../../src/constructores/constructorXHTML');

describe('E12.6-C.17.13 — Instrumentación Causal de la Población Anónima', () => {

    test('Analiza el contexto DOM de los 208 elementos <p> vacíos frente a los nodos legítimos', () => {
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

        // 2. Compilación y Renderizado
        const resultadoCompilacion = compilarLexmotor(adaptado.ast);
        const xhtmlGenerado = constructorXHTML(resultadoCompilacion.ast.contenido);
        const dom = new JSDOM(xhtmlGenerado);
        const document = dom.window.document;

        // 3. Inspección topológica de los elementos <p> en el DOM
        const todosLosP = Array.from(document.querySelectorAll('p'));
        let conTraza = 0;
        let sinTrazaVacios = 0;
        let sinTrazaConContenido = 0;

        const analisisAnonimos = [];

        todosLosP.forEach((p, idx) => {
            const trace = p.getAttribute('data-trace');
            const texto = p.textContent.trim();
            const htmlInterno = p.innerHTML.trim();

            if (trace) {
                conTraza++;
            } else {
                if (htmlInterno === '') {
                    sinTrazaVacios++;
                } else {
                    sinTrazaConContenido++;
                }

                // Analizamos el contexto estructural inmediato (padre y hermanos)
                const padre = p.parentElement ? p.parentElement.tagName : 'SIN-PADRE';
                const previo = p.previousElementSibling ? p.previousElementSibling.tagName : 'INICIO';
                const siguiente = p.nextElementSibling ? p.nextElementSibling.tagName : 'FIN';

                if (analisisAnonimos.length < 15) {
                    analisisAnonimos.push({
                        posicionDom: idx,
                        padreTag: padre,
                        hermanoPrevio: previo,
                        hermanoSiguiente: siguiente,
                        outerHTML: p.outerHTML
                    });
                }
            }
        });

        console.log('\n====================================================================');
        console.log('   E12.6-C.17.13 — INFORME DE AISLAMIENTO DE LA POBLACIÓN ANÓNIMA');
        console.log('====================================================================');
        console.log(`   Total elementos <p> en DOM        : ${todosLosP.length}`);
        console.log(`   Elementos <p> con traceId (AST)   : ${conTraza}`);
        console.log(`   Elementos <p> sin traceId VACÍOS  : ${sinTrazaVacios}`);
        console.log(`   Elementos <p> sin traceId c/texto : ${sinTrazaConContenido}`);
        console.log('--------------------------------------------------------------------');
        console.log('   Muestra del contexto estructural de elementos anónimos:');
        analisisAnonimos.forEach((m, i) => {
            console.log(`     [${i + 1}] Pos: ${m.posicionDom} | Padre: <${m.padreTag}> | Prev: <${m.hermanoPrevio}> | Sig: <${m.hermanoSiguiente}>`);
            console.log(`         HTML: ${m.outerHTML}`);
        });
        console.log('====================================================================\n');

        expect(todosLosP.length).toBe(1325);
        expect(conTraza).toBe(1117);
        expect(sinTrazaVacios).toBe(208);
    });

});