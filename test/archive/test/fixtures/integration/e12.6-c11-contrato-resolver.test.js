'use strict';

const path = require('path');
const fsExtra = require('fs');
const { JSDOM } = require('jsdom');
const { adaptarInDesign } = require('../../../src/adaptadores/InDesignAdapter');
const { constructorXHTML } = require('../../../src/constructores/constructorXHTML');
const { _sanitizeSelector } = require('../../../src/adaptadores/SemanticResolver');

describe('E12.6-C.11 — Contrato Normativo de Resolución de Estilos (Diagnóstico Agrupado)', () => {

    test('Matriz de conteo y colisión por Estilo AST vs Clase XHTML', () => {
        const rootDir = path.resolve(__dirname, '../../..');
        const rutaJsonFixture = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');
        const rutaMapFixture = path.resolve(rootDir, 'src/assets/style-model.json');

        const contenidoRaw = JSON.parse(fsExtra.readFileSync(rutaJsonFixture, 'utf8'));
        
        let semanticMap = null;
        try {
            semanticMap = JSON.parse(fsExtra.readFileSync(rutaMapFixture, 'utf8'));
        } catch (e) {
            console.warn('Advertencia: style-model.json no disponible para el test C.11');
        }

        // 1. Adaptación pura (ahora inyecta el PresentationResolver internamente)
        const adaptado = adaptarInDesign({ jsonCrudo: contenidoRaw, semanticMap: semanticMap });

        let listaNodos = [];
        if (adaptado && adaptado.ast && Array.isArray(adaptado.ast.contenido)) {
            listaNodos = adaptado.ast.contenido;
        } else {
            throw new Error("Fallo en adaptador: ast.contenido no disponible.");
        }

        // 2. Compilación XHTML
        const xhtmlGenerado = constructorXHTML(listaNodos);
        const dom = new JSDOM(xhtmlGenerado);
        
        // Recogemos TODOS los elementos renderizados que deberían tener clase
        const elementosRenderizados = Array.from(dom.window.document.querySelectorAll('p, span'));

        let totalViolaciones = 0;
        const matrizViolaciones = {};

        // Recolectamos recursivamente todos los nodos del AST para comparar
        const flatAstNodes = [];
        function flattenAst(nodo) {
            if (!nodo || typeof nodo !== 'object') return;
            // Solo los nodos con texto visible o los contenedores principales nos importan
            if (nodo.texto || nodo.tipoNodo === 'paragraph' || nodo.tipoNodo === 'character') {
                flatAstNodes.push(nodo);
            }
            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(flattenAst);
            }
        }
        listaNodos.forEach(flattenAst);

        console.log(`\n====================================================================`);
        console.log(`     E12.6-C.11 — AUDITORÍA ALINEADA (DOM RECOLECTADO: ${elementosRenderizados.length} | AST PLANO: ${flatAstNodes.length})`);
        console.log(`====================================================================`);

        // Comprobación Mínima: Verificar que los elementos DOM no quedaron desnudos injustificadamente.
        elementosRenderizados.forEach((el, i) => {
            const claseEmitida = el.className || '[sin-clase]';
            
            // Si no tiene clase, verificamos si era un nodo "[Ninguno]" en el AST (el cual es válido que no tenga clase)
            if (claseEmitida === '[sin-clase]') {
                const astRef = flatAstNodes[i]; // Aproximación, aunque la correspondencia 1:1 es heurística
                const estiloAst = astRef ? (astRef.estiloParrafo || astRef.inDesignStyle || astRef.estiloCaracter) : null;
                
                if (estiloAst !== '[Ninguno]') {
                    const key = `XHTML Tag: ${el.tagName.toLowerCase()} ==> AST Estilo Probable: ${estiloAst || 'Desconocido'}`;
                    matrizViolaciones[key] = (matrizViolaciones[key] || 0) + 1;
                    totalViolaciones++;
                }
            } else {
                // Comprobamos que la clase emitida sea una clase "saneada" válida, sin espacios en blanco absurdos o mayúsculas.
                const claseEsperada = _sanitizeSelector(claseEmitida);
                if (claseEmitida !== claseEsperada && claseEmitida.indexOf(' ') === -1) {
                    const key = `XHTML Clase Mal Formada: ${claseEmitida} (Esperaba: ${claseEsperada})`;
                    matrizViolaciones[key] = (matrizViolaciones[key] || 0) + 1;
                    totalViolaciones++;
                }
            }
        });

        if (totalViolaciones > 0) {
            console.log(`     Total de elementos con violación de contrato: ${totalViolaciones}`);
            console.log(`     Desglose agrupado por patrón de colisión:`);
            Object.keys(matrizViolaciones).sort((a, b) => matrizViolaciones[b] - matrizViolaciones[a]).forEach(key => {
                console.log(`       ↳ ${key} :  ${matrizViolaciones[key]} veces`);
            });
        } else {
            console.log(`     ¡Contrato de Clases Semánticas 100% CUMPLIDO!`);
        }
        console.log(`====================================================================\n`);

        expect(totalViolaciones).toBe(0);
    });

});