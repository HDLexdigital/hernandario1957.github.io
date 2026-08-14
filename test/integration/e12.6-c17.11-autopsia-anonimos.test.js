'use strict';

const path = require('path');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');
const { constructorXHTML } = require('../../src/constructores/constructorXHTML');

describe('E12.6-C.17.11 — Autopsia Forense de los 208 Elementos <p> sin Identidad', () => {

    test('Inspecciona atributos, texto y contexto de los elementos DOM huérfanos de traceId', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        // 1. Ingestión, Adaptación e Inyección Universal de __traceId (1117 nodos)
        const adaptado = adaptarInDesign({ jsonCrudo });
        let nodosAdaptados = adaptado.ast.contenido || adaptado.ast;

        let contadorAst = 0;
        const textosEditorialesSet = new Set();

        const inyectarYRecolectar = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;
            contadorAst++;
            const traceId = `ast-${String(contadorAst).padStart(4, '0')}`;
            nodo.__traceId = traceId;

            const esEditorial = typeof nodo.inDesignStyle === 'string' && nodo.inDesignStyle.trim() !== '';
            if (esEditorial && typeof nodo.texto === 'string') {
                textosEditorialesSet.add(nodo.texto.trim());
            }

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(inyectarYRecolectar);
            }
        };

        if (Array.isArray(nodosAdaptados)) {
            nodosAdaptados.forEach(inyectarYRecolectar);
        } else {
            inyectarYRecolectar(nodosAdaptados);
        }

        // 2. Compilación y Renderizado XHTML con trazas activas
        const resultadoCompilacion = compilarLexmotor(adaptado.ast);
        const xhtmlGenerado = constructorXHTML(resultadoCompilacion.ast.contenido);
        const dom = new JSDOM(xhtmlGenerado);
        const document = dom.window.document;

        // 3. Recolección y Autopsia de los <p> sin traceId
        const todosLosP = Array.from(document.querySelectorAll('p'));
        const anonimos = todosLosP.filter(p => !p.hasAttribute('data-trace'));

        console.log('\n====================================================================');
        console.log('   E12.6-C.17.11 — AUTOPSIA DE ELEMENTOS <p> ANÓNIMOS');
        console.log('====================================================================');
        console.log(`   Total elementos <p> en DOM      : ${todosLosP.length}`);
        console.log(`   Elementos <p> con traceId       : ${todosLosP.length - anonimos.length}`);
        console.log(`   Elementos <p> ANÓNIMOS (sin traza): ${anonimos.length}`);
        console.log('--------------------------------------------------------------------');

        let anonimosConTextoCoincidente = 0;
        const muestrasAutopsia = [];

        anonimos.slice(0, 10).forEach((p, idx) => {
            const textoP = p.textContent.trim();
            const claseP = p.getAttribute('class') || '[sin-clase]';
            const coincideConEditorial = textosEditorialesSet.has(textoP);

            if (coincideConEditorial) {
                anonimosConTextoCoincidente++;
            }

            muestrasAutopsia.push({
                index: idx + 1,
                clase: claseP,
                longitudTexto: textoP.length,
                extractoTexto: textoP.substring(0, 40),
                coincideTextoEditorial: coincideConEditorial,
                outerHTML: p.outerHTML.substring(0, 120) + '...'
            });
        });

        // Contamos el total de anónimos que coinciden en texto con los editoriales
        const totalAnonimosCoincidentes = anonimos.filter(p => textosEditorialesSet.has(p.textContent.trim())).length;

        console.log(`   Muestra de los primeros 10 elementos anónimos:`);
        muestrasAutopsia.forEach(m => {
            console.log(`     [${m.index}] Clase: "${m.clase}" | Coincide texto: ${m.coincideTextoEditorial}`);
            console.log(`         Extracto: "${m.extractoTexto}"`);
        });

        console.log('--------------------------------------------------------------------');
        console.log(`   Total de anónimos cuyo texto coincide con un nodo editorial: ${totalAnonimosCoincidentes} de ${anonimos.length}`);
        console.log('====================================================================\n');

        expect(todosLosP.length).toBe(1325);
        expect(anonimos.length).toBe(208);
    });

});