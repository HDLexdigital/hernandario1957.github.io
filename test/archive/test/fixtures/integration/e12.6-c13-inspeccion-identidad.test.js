'use strict';

const path = require('path');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const { adaptarInDesign } = require('../../../src/adaptadores/InDesignAdapter');
const { constructorXHTML } = require('../../../src/constructores/constructorXHTML');

describe('E12.6-C.13 — Inspección Forense de Identidad Estilística (Observacional)', () => {
    
    test('Extracción de claves, metadatos y propiedades comparativas en bifurcaciones', () => {
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

        // 3. Inspección forense detallada para TerminoGlosario y P01_BODY_CONT
        const estilosObjetivo = ['TerminoGlosario', 'P01_BODY_CONT'];
        const muestrasInspeccion = {
            'TerminoGlosario': { textoCuerpo: [], sinClase: [] },
            'P01_BODY_CONT': { textoCuerpo: [], sinClase: [] }
        };

        let indiceDomObj = { val: 0 };

        const auditarProfundo = (nodo, indiceDom) => {
            if (!nodo || typeof nodo !== 'object') return;

            const estiloOriginal = 
                nodo.inDesignStyle || 
                nodo.estiloParrafo || 
                nodo.estiloCaracter || 
                null;

            if (estilosObjetivo.includes(estiloOriginal)) {
                const elDom = elementosP[indiceDom.val];
                const claseEmitida = elDom ? (elDom.getAttribute('class') || '[sin-clase]') : '[ausente]';

                const perfilNodo = {
                    keysNodo: Object.keys(nodo),
                    inDesignStyle: nodo.inDesignStyle || null,
                    estiloParrafo: nodo.estiloParrafo || null,
                    estiloCaracter: nodo.estiloCaracter || null,
                    tipo: nodo.tipo || null,
                    tipoNodo: nodo.tipoNodo || null,
                    tieneMetadata: !!nodo.metadata,
                    metadataKeys: nodo.metadata ? Object.keys(nodo.metadata) : [],
                    tieneAttributes: !!nodo.attributes,
                    attributesKeys: nodo.attributes ? Object.keys(nodo.attributes) : [],
                    tienePropiedadesEstilo: !!nodo.propiedadesEstilo,
                    propiedadesEstiloKeys: nodo.propiedadesEstilo ? Object.keys(nodo.propiedadesEstilo) : [],
                    textoMuestra: (nodo.texto || '').toString().substring(0, 20)
                };

                if (claseEmitida === 'texto_cuerpo') {
                    if (muestrasInspeccion[estiloOriginal].textoCuerpo.length < 1) {
                        muestrasInspeccion[estiloOriginal].textoCuerpo.push(perfilNodo);
                    }
                } else if (claseEmitida === '[sin-clase]' || claseEmitida === '') {
                    if (muestrasInspeccion[estiloOriginal].sinClase.length < 1) {
                        muestrasInspeccion[estiloOriginal].sinClase.push(perfilNodo);
                    }
                }
            }

            indiceDom.val++;

            ['contenido', 'hijos', 'children', 'ast', 'blocks', 'parrafos'].forEach(prop => {
                const sub = nodo[prop];
                if (Array.isArray(sub)) {
                    sub.forEach(hijo => auditarProfundo(hijo, indiceDom));
                }
            });
        };

        listaNodos.forEach(nodoRaiz => auditarProfundo(nodoRaiz, indiceDomObj));

        console.log('\n====================================================================');
        console.log('   E12.6-C.13 — INSPECCIÓN FORENSE DE LLAVES Y METADATOS');
        console.log('====================================================================');
        
        Object.entries(muestrasInspeccion).forEach(([estilo, rutas]) => {
            console.log(`\n   Estilo AST: [${estilo}]`);
            console.log(`     ├── Ruta A (Emiten 'texto_cuerpo'):`);
            rutas.textoCuerpo.forEach((p, i) => {
                console.log(`         [${i + 1}] Keys principales:`, p.keysNodo);
                console.log(`             inDesignStyle: "${p.inDesignStyle}" | estiloParrafo: "${p.estiloParrafo}" | estiloCaracter: "${p.estiloCaracter}"`);
                console.log(`             Metadata keys:`, p.metadataKeys, `| PropiedadesEstilo keys:`, p.propiedadesEstiloKeys);
            });
            console.log(`     └── Ruta B (Emiten 'sin-clase'):`);
            rutas.sinClase.forEach((p, i) => {
                console.log(`         [${i + 1}] Keys principales:`, p.keysNodo);
                console.log(`             inDesignStyle: "${p.inDesignStyle}" | estiloParrafo: "${p.estiloParrafo}" | estiloCaracter: "${p.estiloCaracter}"`);
                console.log(`             Metadata keys:`, p.metadataKeys, `| PropiedadesEstilo keys:`, p.propiedadesEstiloKeys);
            });
        });
        console.log('\n====================================================================\n');

        expect(Object.keys(muestrasInspeccion).length).toBe(2);
    });

});