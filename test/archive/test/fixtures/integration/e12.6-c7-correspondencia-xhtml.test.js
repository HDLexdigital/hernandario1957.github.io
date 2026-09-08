'use strict';

const path = require('path');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const { adaptarInDesign } = require('../../../src/adaptadores/InDesignAdapter');
const { constructorXHTML } = require('../../../src/constructores/constructorXHTML');

describe('E12.6-C.7 — Trazabilidad de Correspondencia AST → XHTML (Observacional)', () => {
    
    test('Auditoría de duplicación: Comparación numérica de nodos AST vs Elementos XHTML', () => {
        const rootDir = path.resolve(__dirname, '../../..');
        const rutaJsonFixture = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const contenidoRaw = JSON.parse(fs.readFileSync(rutaJsonFixture, 'utf8'));

        // 1. Adaptación pura (caja negra)
        const adaptado = adaptarInDesign({ jsonCrudo: contenidoRaw });

        let listaNodos = [];
        if (adaptado && adaptado.ast && Array.isArray(adaptado.ast.contenido)) {
            listaNodos = adaptado.ast.contenido;
        } else {
            throw new Error("Fallo forense: No se encontró adaptado.ast.contenido");
        }

        // 2. Conteo estructural previo en el AST
        let contadorRaicesAST = listaNodos.length; // Debería ser 208
        let contadorHijosAST = 0;

        const contarHijos = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;
            ['contenido', 'hijos', 'children', 'ast', 'blocks', 'parrafos'].forEach(prop => {
                const sub = nodo[prop];
                if (Array.isArray(sub)) {
                    sub.forEach(hijo => {
                        if (hijo && typeof hijo === 'object') {
                            contadorHijosAST++;
                            contarHijos(hijo);
                        }
                    });
                }
            });
        };

        listaNodos.forEach(contarHijos);
        const totalNodosAST = contadorRaicesAST + contadorHijosAST;

        // 3. Compilación limpia a XHTML utilizando el constructor pasivo actual
        const xhtmlGenerado = constructorXHTML(listaNodos);
        const dom = new JSDOM(xhtmlGenerado);

        // 4. Conteo de elementos generados en el DOM del XHTML
        const elementosBody = Array.from(dom.window.document.querySelectorAll('body *'));
        const totalElementosXHTML = elementosBody.length;

        const conteoTags = {};
        elementosBody.forEach(el => {
            const tag = el.tagName.toLowerCase();
            conteoTags[tag] = (conteoTags[tag] || 0) + 1;
        });

        console.log('\n====================================================================');
        console.log('   E12.6-C.7 — AUDITORÍA DE CORRESPONDENCIA AST vs XHTML');
        console.log('====================================================================');
        console.log(`   Nodos Raíz AST (Primer Nivel)        : ${contadorRaicesAST}`);
        console.log(`   Nodos Internos AST (Descendientes)   : ${contadorHijosAST}`);
        console.log(`   Total Nodos AST (Raíces + Internos)  : ${totalNodosAST}`);
        console.log('--------------------------------------------------------------------');
        console.log(`   Total Elementos en XHTML (BODY *)    : ${totalElementosXHTML}`);
        console.log('   Desglose de Etiquetas en el XHTML:');
        Object.entries(conteoTags).forEach(([tag, freq]) => {
            console.log(`     ↳ <${tag}> : ${freq} elementos`);
        });
        console.log('--------------------------------------------------------------------');
        console.log(`   Diferencia (XHTML - Total AST)       : ${totalElementosXHTML - totalNodosAST}`);
        console.log(`   Diferencia (XHTML - Raíces AST)      : ${totalElementosXHTML - contadorRaicesAST}`);
        console.log('====================================================================\n');

        expect(totalNodosAST).toBe(1117);
        expect(contadorRaicesAST).toBe(208);
    });

});