'use strict';

const path = require('path');
const fs = filepathSync => fs.readFileSync(filepathSync, 'utf8');
const fsExtra = require('fs');
const { JSDOM } = require('jsdom');
const { adaptarInDesign } = require('../../../src/adaptadores/InDesignAdapter');
const { constructorXHTML } = require('../../../src/constructores/constructorXHTML');

describe('E12.6-C.11 — Contrato Normativo de Resolución de Estilos (Diagnóstico Agrupado)', () => {
    
    test('Matriz de conteo y colisión por Estilo AST vs Clase XHTML', () => {
        const rootDir = path.resolve(__dirname, '../../..');
        const rutaJsonFixture = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const contenidoRaw = JSON.parse(fsExtra.readFileSync(rutaJsonFixture, 'utf8'));

        // 1. Adaptación pura
        const adaptado = adaptarInDesign({ jsonCrudo: contenidoRaw });

        let listaNodos = [];
        if (adaptado && adaptado.ast && Array.isArray(adaptado.ast.contenido)) {
            listaNodos = adaptado.ast.contenido;
        } else {
            throw new Error("Fallo en adaptador: ast.contenido no disponible.");
        }

        // 2. Compilación XHTML
        const xhtmlGenerado = constructorXHTML(listaNodos);
        const dom = new JSDOM(xhtmlGenerado);
        const elementosP = Array.from(dom.window.document.querySelectorAll('p'));

        // 3. Agrupación y Matriz de Colisión
        const matrizViolaciones = {};
        let indiceDomObj = { val: 0 };
        let totalViolaciones = 0;

        const auditarYAgrupar = (nodo, indiceDom) => {
            if (!nodo || typeof nodo !== 'object') return;

            const estiloOriginal = 
                nodo.inDesignStyle || 
                nodo.estiloParrafo || 
                nodo.estiloCaracter || 
                '[sin-estilo]';

            const elementoDom = elementosP[indiceDom.val];
            const claseEmitida = elementoDom ? (elementoDom.getAttribute('class') || '[sin-clase]') : '[elemento-dom-ausente]';

            // Criterio de violación de contrato:
            // Si el estilo original existe y no se refleja de forma determinista en la clase emitida
            const normalizadoEsperado = estiloOriginal.toLowerCase().replace(/[\s_]/g, '-');
            const claseLower = claseEmitida.toLowerCase();
            const reflejaEstilo = claseLower.includes(normalizadoEsperado) || claseLower.includes(estiloOriginal.toLowerCase());

            if (estiloOriginal !== '[Ninguno]' && !reflejaEstilo) {
                totalViolaciones++;
                const llaveFirma = `AST: [${estiloOriginal}] ==> XHTML: [${claseEmitida}]`;
                matrizViolaciones[llaveFirma] = (matrizViolaciones[llaveFirma] || 0) + 1;
            }

            indiceDom.val++;

            ['contenido', 'hijos', 'children', 'ast', 'blocks', 'parrafos'].forEach(prop => {
                const sub = nodo[prop];
                if (Array.isArray(sub)) {
                    sub.forEach(hijo => auditarYAgrupar(hijo, indiceDom));
                }
            });
        };

        listaNodos.forEach(nodoRaiz => auditarYAgrupar(nodoRaiz, indiceDomObj));

        console.log('\n====================================================================');
        console.log('   E12.6-C.11 — MATRIZ AGRUPADA DE COLISIONES ESTILÍSTICAS');
        console.log('====================================================================');
        console.log(`   Total de nodos con violación de contrato: ${totalViolaciones}`);
        console.log('   Desglose agrupado por patrón de colisión:');
        
        Object.entries(matrizViolaciones)
            .sort((a, b) => b[1] - a[1])
            .forEach(([firma, cantidad]) => {
                console.log(`     ↳ ${firma.padEnd(55)} : ${cantidad.toString().padStart(4)} veces`);
            });
        
        console.log('====================================================================\n');

        // Estado RED deliberado hasta construir el StyleIdentityResolver
        expect(totalViolaciones).toBe(0);
    });

});