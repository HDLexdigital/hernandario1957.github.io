'use strict';

const path = require('path');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');
const { constructorXHTML } = require('../../src/constructores/constructorXHTML');

describe('E12.6-C.17.17 — Autopsia Microscópica del Prefijo RAW y del DOM Inicial', () => {

    test('Genera la tabla comparativa detallada de los primeros elementos del DOM frente al XHTML RAW', () => {
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

        // 3. Extracción de los primeros 1000 caracteres del RAW para inspección de prefijo
        const prefijoRaw = xhtmlBruto.substring(0, 1000);

        // 4. Parseo en JSDOM (HTML Parser estándar)
        const dom = new JSDOM(xhtmlBruto);
        const document = dom.window.document;
        const elementosP = Array.from(document.querySelectorAll('p'));

        // 5. Construcción de la tabla de los primeros 10 elementos del DOM
        const tablaDom = elementosP.slice(0, 10).map((p, index) => {
            return {
                domIndex: index,
                traceId: p.getAttribute('data-trace') || 'NINGUNO',
                className: p.getAttribute('class') || '[sin-clase]',
                textContent: p.textContent.trim().substring(0, 35),
                outerHTML: p.outerHTML.substring(0, 70)
            };
        });

        // 6. Informe Forense en Consola
        console.log('\n====================================================================');
        console.log('   E12.6-C.17.17 — AUTOPSIA MICROSCOPICA DEL PREFIJO Y DOM INICIAL');
        console.log('====================================================================');
        console.log('   [EXTRACTO DEL PREFIJO XHTML RAW (Primeros 1000 caracteres)]:\n');
        console.log(prefijoRaw);
        console.log('\n--------------------------------------------------------------------');
        console.log('   [TABLA COMPARATIVA DE LOS PRIMEROS 10 ELEMENTOS DEL DOM]:\n');
        
        tablaDom.forEach(row => {
            console.log(`   DOM [${row.domIndex}] | Traza: ${row.traceId.padEnd(10)} | Clase: ${row.className.padEnd(15)} | Texto: "${row.textContent}"`);
            console.log(`            HTML: ${row.outerHTML}`);
        });

        console.log('====================================================================\n');

        expect(xhtmlBruto).toBeDefined();
        expect(elementosP.length).toBe(1325);
    });

});