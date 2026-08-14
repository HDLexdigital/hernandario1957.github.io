'use strict';

const path = require('path');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');
const { constructorXHTML } = require('../../src/constructores/constructorXHTML');

describe('E12.6-C.17.8 — Auditoría de Contrato Cuantitativo Exhaustivo (208/208 Nodos)', () => {

    test('Verifica biunívocamente los cinco invariantes de trazabilidad para cada nodo editorial', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        // 1. Ingestión y Adaptación
        const adaptado = adaptarInDesign({ jsonCrudo });
        let nodosAdaptados = adaptado.ast.contenido || adaptado.ast;

        // 2. Inyección de traceId biunívoco a todos los nodos editoriales resolubles
        const diccionarioEsperado = new Map();
        let contador = 0;

        const inyectarTraceId = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;
            const esEditorial = typeof nodo.inDesignStyle === 'string' && nodo.inDesignStyle.trim() !== '';
            
            if (esEditorial) {
                contador++;
                const traceId = `TRACE-${String(contador).padStart(4, '0')}`;
                nodo.__traceId = traceId;
            }

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(inyectarTraceId);
            }
        };

        if (Array.isArray(nodosAdaptados)) {
            nodosAdaptados.forEach(inyectarTraceId);
        } else {
            inyectarTraceId(nodosAdaptados);
        }

        // 3. Compilación Determinista (C.17.5-A) que calcula el resolvedClass
        const resultadoCompilacion = compilarLexmotor(adaptado.ast);

        // Recolectamos las expectativas directamente del AST compilado
        const recolectarExpectativas = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;
            if (typeof nodo.__traceId === 'string') {
                diccionarioEsperado.set(nodo.__traceId, {
                    estilo: nodo.inDesignStyle.trim(),
                    resolvedClassEsperada: nodo.resolvedClass || ''
                });
            }
            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(recolectarExpectativas);
            }
        };

        if (Array.isArray(resultadoCompilacion.ast.contenido)) {
            resultadoCompilacion.ast.contenido.forEach(recolectarExpectativas);
        } else {
            recolectarExpectativas(resultadoCompilacion.ast.contenido);
        }

        // 4. Renderizado XHTML con atributos data-trace
        const xhtmlGenerado = constructorXHTML(resultadoCompilacion.ast.contenido);
        const dom = new JSDOM(xhtmlGenerado);
        const document = dom.window.document;

        console.log('\n====================================================================');
        console.log('   E12.6-C.17.8 — INFORME DE VERIFICACIÓN CUANTITATIVA 208/208');
        console.log('====================================================================');
        console.log(`   1. Total editorial esperados : ${diccionarioEsperado.size}`);

        let traceIdsUnicosEncontrados = 0;
        let traceIdsEnDOM = 0;
        let clasesCoincidentes = 0;
        let divergencias = 0;
        const reporteFallas = [];

        diccionarioEsperado.forEach((valor, traceId) => {
            traceIdsUnicosEncontrados++;
            const elementoDom = document.querySelector(`[data-trace="${traceId}"]`);

            if (elementoDom) {
                traceIdsEnDOM++;
                const claseEmitida = elementoDom.getAttribute('class') || '';
                
                if (claseEmitida === valor.resolvedClassEsperada) {
                    clasesCoincidentes++;
                } else {
                    divergencias++;
                    reporteFallas.push(`[Divergencia] ${traceId} (${valor.estilo}): esperado [${valor.resolvedClassEsperada}], obtenido [${claseEmitida}]`);
                }
            } else {
                divergencias++;
                reporteFallas.push(`[Ausente] TraceId ${traceId} no fue encontrado en el DOM.`);
            }
        });

        console.log(`   2. TraceId únicos verificados: ${traceIdsUnicosEncontrados}`);
        console.log(`   3. TraceId encontrados en DOM: ${traceIdsEnDOM}`);
        console.log(`   4. Clases coincidentes       : ${clasesCoincidentes}`);
        console.log(`   5. Divergencias totales      : ${divergencias}`);

        if (reporteFallas.length > 0) {
            console.log('\n   Detalle de divergencias:', reporteFallas.slice(0, 5));
        }
        console.log('====================================================================\n');

        // Los cinco invariantes de C.17.8
        expect(diccionarioEsperado.size).toBe(208);
        expect(traceIdsUnicosEncontrados).toBe(208);
        expect(traceIdsEnDOM).toBe(208);
        expect(clasesCoincidentes).toBe(208);
        expect(divergencias).toBe(0);
    });

});