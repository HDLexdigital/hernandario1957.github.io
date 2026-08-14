'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../../src/adaptadores/InDesignAdapter');

describe('E12.6-C.5 — Radiografía de Hijos y Contenido Interno (Observacional)', () => {
    
    test('Inspección microscópica del array contenido[] en bloques editoriales raíz', () => {
        const rootDir = path.resolve(__dirname, '../../..');
        const rutaJsonFixture = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const contenidoRaw = JSON.parse(fs.readFileSync(rutaJsonFixture, 'utf8'));

        // 1. Adaptación pura (caja negra)
        const adaptado = adaptarInDesign({ jsonCrudo: contenidoRaw });

        // 2. Extracción de la población raíz comprobada
        let listaNodos = [];
        if (adaptado && adaptado.ast && Array.isArray(adaptado.ast.contenido)) {
            listaNodos = adaptado.ast.contenido;
        } else {
            throw new Error("Fallo forense: No se encontró adaptado.ast.contenido");
        }

        const muestrasHijos = [];
        let contadorRaicesConContenidoArray = 0;

        const explorarAST = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;

            const estilo = nodo.inDesignStyle || nodo.estiloParrafo || '[sin-estilo]';
            const esRaizEditorial = estilo.startsWith('P0'); // Bloques canónicos identificados

            if (esRaizEditorial && Array.isArray(nodo.contenido) && nodo.contenido.length > 0) {
                contadorRaicesConContenidoArray++;
                
                if (muestrasHijos.length < 2) {
                    muestrasHijos.push({
                        estiloRaiz: estilo,
                        textoRaiz: nodo.texto ? nodo.texto.substring(0, 60) + '...' : '',
                        cantidadHijos: nodo.contenido.length,
                        hijosDetalle: nodo.contenido.map((hijo, idx) => ({
                            indice: idx,
                            tipo: hijo.tipo,
                            tipoNodo: hijo.tipoNodo,
                            estiloCaracter: hijo.estiloCaracter || hijo.inDesignStyle || '[sin-estilo-caracter]',
                            texto: hijo.texto || '',
                            clavesHijo: Object.keys(hijo)
                        }))
                    });
                }
            }

            // Propagación recursiva segura por si hay anidaciones profundas
            ['contenido', 'hijos', 'children', 'ast', 'blocks', 'parrafos'].forEach(prop => {
                if (nodo[prop] && Array.isArray(nodo[prop]) && prop !== 'contenido') {
                    nodo[prop].forEach(explorarAST);
                }
            });
        };

        listaNodos.forEach(explorarAST);

        console.log('\n====================================================================');
        console.log('   E12.6-C.5 — RADIOGRAFÍA DE HIJOS (ESTRUCTURA INTERNA DE CONTENIDO)');
        console.log('====================================================================');
        console.log(`   Total de raíces con contenido en Array encontradas: ${contadorRaicesConContenidoArray}`);
        
        muestrasHijos.forEach((muestra, idx) => {
            console.log(`\n   [Bloque Raíz ${idx + 1}] Estilo: ${muestra.estiloRaiz} | Hijos: ${muestra.cantidadHijos}`);
            console.log(`   Texto: "${muestra.textoRaiz}"`);
            console.log('   Detalle de Hijos internos:');
            console.log(JSON.stringify(muestra.hijosDetalle, null, 2));
        });

        console.log('\n====================================================================\n');

        expect(listaNodos.length).toBeGreaterThan(0);
    });

});