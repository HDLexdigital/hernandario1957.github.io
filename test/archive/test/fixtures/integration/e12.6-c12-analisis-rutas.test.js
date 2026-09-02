'use strict';

const path = require('path');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const { adaptarInDesign } = require('../../../src/adaptadores/InDesignAdapter');
const { constructorXHTML } = require('../../../src/constructores/constructorXHTML');

describe('E12.6-C.12 — Análisis Forense de Rutas de Renderización (Observacional)', () => {
    
    test('Contraste de propiedades estructurales entre nodos con texto_cuerpo y sin-clase', () => {
        const rootDir = path.resolve(__dirname, '../../..');
        const rutaJsonFixture = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const contenidoRaw = JSON.parse(fs.readFileSync(rutaJsonFixture, 'utf8'));

        // 1. Adaptación pura
        const adaptado = adaptarInDesign({ jsonCrudo: contenidoRaw });
        let listaNodos = adaptado.ast.contenido;

        // 2. Compilación XHTML
        const xhtmlGenerado = constructorXHTML(listaNodos);
        const dom = new JSDOM(xhtmlGenerado);
        const elementosP = Array.from(dom.window.document.querySelectorAll('p'));

        // 3. Inspección y comparación de las bifurcaciones para los tres estilos críticos
        const estilosObjetivo = ['TerminoGlosario', 'P01_BODY_CONT', 'P01_BODY_BASE'];
        const muestrasBifurcacion = {
            'TerminoGlosario': { textoCuerpo: [], sinClase: [] },
            'P01_BODY_CONT': { textoCuerpo: [], sinClase: [] },
            'P01_BODY_BASE': { textoCuerpo: [], sinClase: [] }
        };

        let indiceDomObj = { val: 0 };

        const auditarNodos = (nodo, indiceDom) => {
            if (!nodo || typeof nodo !== 'object') return;

            const estiloOriginal = 
                nodo.inDesignStyle || 
                nodo.estiloParrafo || 
                nodo.estiloCaracter || 
                null;

            if (estilosObjetivo.includes(estiloOriginal)) {
                const elementoDom = elementosP[indiceDom.val];
                const claseEmitida = elementoDom ? (elementoDom.getAttribute('class') || '[sin-clase]') : '[ausente]';

                const datosNodo = {
                    tipo: nodo.tipo || '[sin-tipo]',
                    tipoNodo: nodo.tipoNodo || '[sin-tipoNodo]',
                    tieneContenidoArray: Array.isArray(nodo.contenido),
                    longitudContenido: Array.isArray(nodo.contenido) ? nodo.contenido.length : 0,
                    primerHijoTipo: (Array.isArray(nodo.contenido) && nodo.contenido[0]) ? (nodo.contenido[0].tipo || nodo.contenido[0].tipoNodo || 'desconocido') : 'ninguno',
                    textoMuestra: (nodo.texto || '').toString().substring(0, 30)
                };

                if (claseEmitida === 'texto_cuerpo') {
                    if (muestrasBifurcacion[estiloOriginal].textoCuerpo.length < 2) {
                        muestrasBifurcacion[estiloOriginal].textoCuerpo.push(datosNodo);
                    }
                } else if (claseEmitida === '[sin-clase]' || claseEmitida === '') {
                    if (muestrasBifurcacion[estiloOriginal].sinClase.length < 2) {
                        muestrasBifurcacion[estiloOriginal].sinClase.push(datosNodo);
                    }
                }
            }

            indiceDom.val++;

            ['contenido', 'hijos', 'children', 'ast', 'blocks', 'parrafos'].forEach(prop => {
                const sub = nodo[prop];
                if (Array.isArray(sub)) {
                    sub.forEach(hijo => auditarNodos(hijo, indiceDom));
                }
            });
        };

        listaNodos.forEach(nodoRaiz => auditarNodos(nodoRaiz, indiceDomObj));

        console.log('\n====================================================================');
        console.log('   E12.6-C.12 — ANÁLISIS COMPARATIVO DE BIFURCACIONES');
        console.log('====================================================================');
        
        Object.entries(muestrasBifurcacion).forEach(([estilo, rutas]) => {
            console.log(`\n   Estilo AST: [${estilo}]`);
            console.log(`     ├── Ruta A (Emiten 'texto_cuerpo'):`);
            rutas.textoCuerpo.forEach((m, i) => console.log(`         [${i + 1}] tipo: ${m.tipo}, tipoNodo: ${m.tipoNodo}, arrayContenido: ${m.tieneContenidoArray} (len: ${m.longitudContenido}), primerHijo: ${m.primerHijoTipo}`));
            console.log(`     └── Ruta B (Emiten 'sin-clase'):`);
            rutas.sinClase.forEach((m, i) => console.log(`         [${i + 1}] tipo: ${m.tipo}, tipoNodo: ${m.tipoNodo}, arrayContenido: ${m.tieneContenidoArray} (len: ${m.longitudContenido}), primerHijo: ${m.primerHijoTipo}`));
        });
        console.log('\n====================================================================\n');

        expect(Object.keys(muestrasBifurcacion).length).toBe(3);
    });

});