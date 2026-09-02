'use strict';

const path = require('path');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const { adaptarInDesign } = require('../../../src/adaptadores/InDesignAdapter');
const { constructorXHTML } = require('../../../src/constructores/constructorXHTML');

describe('E12.6-C.10 — Trazabilidad Individual AST.style → XHTML.class (Observacional)', () => {
    
    test('Inspección de muestras registro por registro de la transformación estilística', () => {
        const rootDir = path.resolve(__dirname, '../../..');
        const rutaJsonFixture = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const contenidoRaw = JSON.parse(fs.readFileSync(rutaJsonFixture, 'utf8'));

        // 1. Adaptación pura (Caja negra)
        const adaptado = adaptarInDesign({ jsonCrudo: contenidoRaw });

        let listaNodos = [];
        if (adaptado && adaptado.ast && Array.isArray(adaptado.ast.contenido)) {
            listaNodos = adaptado.ast.contenido;
        } else {
            throw new Error("Fallo forense: No se encontró adaptado.ast.contenido");
        }

        // 2. Compilación al XHTML actual
        const xhtmlGenerado = constructorXHTML(listaNodos);
        const dom = new JSDOM(xhtmlGenerado);
        const elementosP = Array.from(dom.window.document.querySelectorAll('p'));

        // 3. Mapeo estructural de nodos del AST (recorrido plano o indexado)
        const muestrasTrazabilidad = [];
        let indiceGlobal = 0;

        const recolectarMuestras = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;

            const estiloAST = 
                nodo.inDesignStyle || 
                nodo.estiloParrafo || 
                nodo.estiloCaracter || 
                (nodo.propiedadesEstilo && nodo.propiedadesEstilo.nombre) || 
                '[sin-estilo]';

            // Capturamos ejemplos de cada estilo distinto existente en el AST
            const yaRegistrado = muestrasTrazabilidad.some(m => m.estiloAST === estiloAST);
            if (!yaRegistrado || muestrasTrazabilidad.length < 15) {
                const elementoDom = elementosP[indiceGlobal];
                muestrasTrazabilidad.push({
                    indice: indiceGlobal,
                    estiloAST: estiloAST,
                    tipoNodo: nodo.tipo || nodo.tipoNodo || '[sin-tipo]',
                    textoMuestra: (nodo.texto || nodo.contenido || '').toString().substring(0, 40) + '...',
                    claseXHTMLGenerada: elementoDom ? (elementoDom.getAttribute('class') || '[sin-clase]') : '[elemento-dom-no-encontrado]'
                });
            }

            indiceGlobal++;

            ['contenido', 'hijos', 'children', 'ast', 'blocks', 'parrafos'].forEach(prop => {
                const sub = nodo[prop];
                if (Array.isArray(sub)) {
                    sub.forEach(recolectarMuestras);
                }
            });
        };

        listaNodos.forEach(recolectarMuestras);

        console.log('\n====================================================================');
        console.log('   E12.6-C.10 — TRAZABILIDAD REGISTRO POR REGISTRO (AST vs XHTML)');
        console.log('====================================================================');
        
        muestrasTrazabilidad.forEach((item, idx) => {
            console.log(`   [Muestra ${idx + 1}] Índice AST: #${item.indice}`);
            console.log(`     ↳ Estilo original AST : "${item.estiloAST}"`);
            console.log(`     ↳ Texto del nodo      : "${item.textoMuestra}"`);
            console.log(`     ↳ Clase XHTML emitida : class="${item.claseXHTMLGenerada}"`);
            console.log('--------------------------------------------------------------------');
        });
        
        console.log('====================================================================\n');

        expect(muestrasTrazabilidad.length).toBeGreaterThan(0);
    });

});