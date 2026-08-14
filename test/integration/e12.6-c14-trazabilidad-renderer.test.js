'use strict';

const path = require('path');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const constructorXHTMLModule = require('../../src/constructores/constructorXHTML');

describe('E12.6-C.14 — Trazabilidad de la Ejecución del Renderer (Forense Dinámica)', () => {
    
    test('Identificación del punto de bifurcación procedural en la generación XHTML', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJsonFixture = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const contenidoRaw = JSON.parse(fs.readFileSync(rutaJsonFixture, 'utf8'));

        // 1. Adaptación pura
        const adaptado = adaptarInDesign({ jsonCrudo: contenidoRaw });
        let listaNodos = adaptado.ast.contenido;

        // 2. Identificación de la función principal del constructor
        const funcionConstructor = typeof constructorXHTMLModule === 'function' 
            ? constructorXHTMLModule 
            : (constructorXHTMLModule.constructorXHTML || constructorXHTMLModule.render || Object.values(constructorXHTMLModule)[0]);

        if (typeof funcionConstructor !== 'function') {
            throw new Error("Fallo forense: No se pudo identificar la función principal del constructor XHTML.");
        }

        // Ejecución para obtener la salida del DOM
        const xhtmlGenerado = funcionConstructor(listaNodos);
        const dom = new JSDOM(xhtmlGenerado);
        const elementosP = Array.from(dom.window.document.querySelectorAll('p'));

        // 3. Rastreo cruzado: Identificación de nodos en Ruta A vs Ruta B
        const hallazgosTrazabilidad = {
            TerminoGlosario: { rutaA_textoCuerpo: 0, rutaB_sinClase: 0 },
            P01_BODY_CONT: { rutaA_textoCuerpo: 0, rutaB_sinClase: 0 }
        };

        let indiceDomObj = { val: 0 };

        const rastrearEjecucion = (nodo, indiceDom) => {
            if (!nodo || typeof nodo !== 'object') return;

            const estiloOriginal = 
                nodo.inDesignStyle || 
                nodo.estiloParrafo || 
                nodo.estiloCaracter || 
                null;

            if (hallazgosTrazabilidad[estiloOriginal]) {
                const elDom = elementosP[indiceDom.val];
                const claseEmitida = elDom ? (elDom.getAttribute('class') || '[sin-clase]') : '[ausente]';

                if (claseEmitida === 'texto_cuerpo') {
                    hallazgosTrazabilidad[estiloOriginal].rutaA_textoCuerpo++;
                } else {
                    hallazgosTrazabilidad[estiloOriginal].rutaB_sinClase++;
                }
            }

            indiceDom.val++;

            ['contenido', 'hijos', 'children', 'ast', 'blocks', 'parrafos'].forEach(prop => {
                const sub = nodo[prop];
                if (Array.isArray(sub)) {
                    sub.forEach(hijo => rastrearEjecucion(hijo, indiceDom));
                }
            });
        };

        listaNodos.forEach(nodoRaiz => rastrearEjecucion(nodoRaiz, indiceDomObj));

        console.log('\n====================================================================');
        console.log('   E12.6-C.14 — INFORME DE BIFURCACIÓN PROCEDURAL');
        console.log('====================================================================');
        Object.entries(hallazgosTrazabilidad).forEach(([estilo, stats]) => {
            console.log(`   Estilo AST: [${estilo}]`);
            console.log(`     ├── Ruta A ('texto_cuerpo') : ${stats.rutaA_textoCuerpo} nodos`);
            console.log(`     └── Ruta B ('sin-clase')    : ${stats.rutaB_sinClase} nodos`);
        });
        console.log('====================================================================\n');

        expect(Object.keys(hallazgosTrazabilidad).length).toBe(2);
    });

});