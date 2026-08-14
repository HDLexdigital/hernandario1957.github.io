'use strict';

const path = require('path');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');

describe('E12.6-C.17.19 — Simulación Experimental de Materialización Estructural', () => {

    test('Simula una estrategia experimental donde los contenedores editoriales con hijos emiten tags envolventes o separan texto propio', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        // 1. Ingestión, Adaptación y Compilación
        const adaptado = adaptarInDesign({ jsonCrudo });
        const resultadoCompilacion = compilarLexmotor(adaptado.ast);

        // 2. Simulación de Renderer Experimental (Evitando anidamiento <p> dentro de <p>)
        const presentationResolver = require('../../src/resolucion/PresentationResolver').PresentationResolver 
            ? new (require('../../src/resolucion/PresentationResolver').PresentationResolver)() 
            : null;

        const renderizarExperimental = (nodo) => {
            if (!nodo || typeof nodo !== 'object') {
                return typeof nodo === 'string' ? nodo : '';
            }

            const tieneHijos = Array.isArray(nodo.contenido) && nodo.contenido.length > 0;
            const esEditorial = typeof nodo.inDesignStyle === 'string' && nodo.inDesignStyle.trim() !== '';

            // Si es un nodo editorial contenedor con hijos, decidimos experimentalmente 
            // usar una etiqueta contenedora estructural (ej. 'div' o 'section') en lugar de 'p' 
            // para evitar el anidamiento ilegal de bloques.
            let tag = nodo.resolvedTag || 'p';
            if (esEditorial && tieneHijos) {
                tag = 'div'; // Contenedor estructural experimental
            }

            let classAttr = '';
            if (nodo.resolvedClass && typeof nodo.resolvedClass === 'string') {
                classAttr = nodo.resolvedClass.trim();
            } else if (presentationResolver) {
                const presClass = presentationResolver.resolve(nodo) || '';
                const semClass = nodo.claseLegal || nodo.claseSemantica || '';
                classAttr = [presClass, semClass].filter(Boolean).join(' ').trim();
            }

            let contenidoHtml = '';
            if (nodo.texto && typeof nodo.texto === 'string') {
                contenidoHtml += nodo.texto;
            }

            if (tieneHijos) {
                contenidoHtml += nodo.contenido.map(hijo => renderizarExperimental(hijo)).join('');
            }

            const traceAttr = nodo.__traceId ? ` data-trace="${nodo.__traceId}"` : '';
            const classAttrStr = classAttr ? ` class="${classAttr}"` : '';

            return `<${tag}${traceAttr}${classAttrStr}>${contenidoHtml}</${tag}>\n`;
        };

        const raizAst = resultadoCompilacion.ast.contenido || resultadoCompilacion.ast;
        let xhtmlExperimental = '';
        if (Array.isArray(raizAst)) {
            xhtmlExperimental = raizAst.map(renderizarExperimental).join('');
        } else {
            xhtmlExperimental = renderizarExperimental(raizAst);
        }

        // 3. Validación en JSDOM del XHTML experimental
        const dom = new JSDOM(xhtmlExperimental);
        const document = dom.window.document;
        
        const totalP = document.querySelectorAll('p').length;
        const totalDiv = document.querySelectorAll('div').length;
        const anidadosInvalidos = document.querySelectorAll('p p').length;
        const vaciosAnonimos = Array.from(document.querySelectorAll('p')).filter(p => !p.hasAttribute('data-trace') && p.textContent.trim() === '').length;

        console.log('\n====================================================================');
        console.log('   E12.6-C.17.19 — INFORME DE SIMULACIÓN EXPERIMENTAL');
        console.log('====================================================================');
        console.log(`   Total elementos <p> en DOM experimental    : ${totalP}`);
        console.log(`   Total elementos <div> (contenedores)       : ${totalDiv}`);
        console.log(`   Párrafos anidados ilegalmente (<p> dentro): ${anidadosInvalidos}`);
        console.log(`   Elementos <p> anónimos y vacíos            : ${vaciosAnonimos}`);
        console.log('====================================================================\n');

        // Verificaciones del modelo experimental
        expect(anidadosInvalidos).toBe(0);
        expect(vaciosAnonimos).toBe(0);
    });

});