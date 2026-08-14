'use strict';

const path = require('path');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');
const { constructorXHTML } = require('../../src/constructores/constructorXHTML');

describe('E12.6-C.17.9 — Auditoría de Cardinalidad y Materialización XHTML', () => {

    test('Analiza la correspondencia estructural entre los nodos del AST (208 + 909) y los elementos generados en el DOM', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        // 1. Ingestión y Adaptación
        const adaptado = adaptarInDesign({ jsonCrudo });
        const nodosAdaptados = adaptado.ast.contenido || adaptado.ast;

        // 2. Conteo estructural de control en el AST
        let contadorEditorial = 0;
        let contadorInterno = 0;

        const auditarNodosAST = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;
            const esEditorial = typeof nodo.inDesignStyle === 'string' && nodo.inDesignStyle.trim() !== '';
            
            if (esEditorial) {
                contadorEditorial++;
            } else {
                contadorInterno++;
            }

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(auditarNodosAST);
            }
        };

        if (Array.isArray(nodosAdaptados)) {
            nodosAdaptados.forEach(auditarNodosAST);
        } else {
            auditarNodosAST(nodosAdaptados);
        }

        // 3. Compilación y Renderizado Estándar (Sin trazas de diagnóstico activas)
        const resultadoCompilacion = compilarLexmotor(adaptado.ast);
        const xhtmlGenerado = constructorXHTML(resultadoCompilacion.ast.contenido);
        const dom = new JSDOM(xhtmlGenerado);
        const totalElementosP = dom.window.document.querySelectorAll('p').length;

        console.log('\n====================================================================');
        console.log('   E12.6-C.17.9 — INFORME DE CARDINALIDAD ESTRUCTURAL XHTML');
        console.log('====================================================================');
        console.log(`   Nodos editoriales (con estilo)       : ${contadorEditorial}`);
        console.log(`   Nodos internos (sin estilo propio)   : ${contadorInterno}`);
        console.log(`   Total analizado en AST               : ${contadorEditorial + contadorInterno}`);
        console.log(`   Total elementos <p> generados en DOM : ${totalElementosP}`);
        console.log('====================================================================\n');

        // Verificaciones de contabilidad estructural pura
        expect(contadorEditorial).toBe(208);
        expect(contadorInterno).toBe(909);
        expect(totalElementosP).toBeGreaterThan(0);
    });

});