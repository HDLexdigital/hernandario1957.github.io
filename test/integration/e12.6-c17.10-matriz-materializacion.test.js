'use strict';

const path = require('path');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');
const { constructorXHTML } = require('../../src/constructores/constructorXHTML');

describe('E12.6-C.17.10 — Matriz de Correlación Causal AST ↔ DOM (Cardinalidad 1117 vs 1325)', () => {

    test('Calcula la matriz exacta de materialización de cada nodo AST frente al DOM XHTML', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        // 1. Ingestión y Adaptación
        const adaptado = adaptarInDesign({ jsonCrudo });
        let nodosAdaptados = adaptado.ast.contenido || adaptado.ast;

        // 2. Inyección universal de __traceId a TODOS los nodos del AST (1117 nodos)
        let contadorAst = 0;
        const mapaAst = new Map(); // traceId -> metadatos del nodo

        const inyectarTraceUniversal = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;
            contadorAst++;
            const traceId = `ast-${String(contadorAst).padStart(4, '0')}`;
            nodo.__traceId = traceId;
            mapaAst.set(traceId, {
                tipo: nodo.tipo,
                tipoNodo: nodo.tipoNodo,
                tieneEstilo: typeof nodo.inDesignStyle === 'string' && nodo.inDesignStyle.trim() !== '',
                tieneContenidoHijos: Array.isArray(nodo.contenido) && nodo.contenido.length > 0
            });

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(inyectarTraceUniversal);
            }
        };

        if (Array.isArray(nodosAdaptados)) {
            nodosAdaptados.forEach(inyectarTraceUniversal);
        } else {
            inyectarTraceUniversal(nodosAdaptados);
        }

        // 3. Compilación Determinista y Renderizado con traza universal activa
        const resultadoCompilacion = compilarLexmotor(adaptado.ast);
        const xhtmlGenerado = constructorXHTML(resultadoCompilacion.ast.contenido);
        const dom = new JSDOM(xhtmlGenerado);
        const document = dom.window.document;

        // 4. Análisis bi-direccional y construcción de la matriz causal
        let astCon0Dom = 0;
        let astCon1Dom = 0;
        let astConMasDe1Dom = 0;

        mapaAst.forEach((meta, traceId) => {
            const elementosDom = document.querySelectorAll(`[data-trace="${traceId}"]`);
            const cantidad = elementosDom.length;

            if (cantidad === 0) {
                astCon0Dom++;
            } else if (cantidad === 1) {
                astCon1Dom++;
            } else {
                astConMasDe1Dom++;
            }
        });

        const todosLosElementosP = document.querySelectorAll('p');
        let domConTraceId = 0;
        let domSinTraceId = 0;
        let identidadesDuplicadasEnDom = 0;

        const trazasVistas = new Set();
        todosLosElementosP.forEach(p => {
            const trace = p.getAttribute('data-trace');
            if (trace) {
                domConTraceId++;
                if (trazasVistas.has(trace)) {
                    identidadesDuplicadasEnDom++;
                } else {
                    trazasVistas.add(trace);
                }
            } else {
                domSinTraceId++;
            }
        });

        // 5. Informe de Matriz Causal en Consola
        console.log('\n====================================================================');
        console.log('   E12.6-C.17.10 — MATRIZ DE CORRELACIÓN CAUSAL AST ↔ DOM');
        console.log('====================================================================');
        console.log(`   AST Total Nodos Inyectados         : ${contadorAst}`);
        console.log(`   AST → 0 DOM                        : ${astCon0Dom}`);
        console.log(`   AST → 1 DOM                        : ${astCon1Dom}`);
        console.log(`   AST → >1 DOM                       : ${astConMasDe1Dom}`);
        console.log('--------------------------------------------------------------------');
        console.log(`   DOM Total Elementos <p>            : ${todosLosElementosP.length}`);
        console.log(`   DOM con traceId                    : ${domConTraceId}`);
        console.log(`   DOM sin traceId                    : ${domSinTraceId}`);
        console.log(`   Identidades traceId duplicadas DOM : ${identidadesDuplicadasEnDom}`);
        console.log('====================================================================\n');

        // Verificaciones estructurales de control
        expect(contadorAst).toBe(1117);
        expect(todosLosElementosP.length).toBe(1325);
    });

});