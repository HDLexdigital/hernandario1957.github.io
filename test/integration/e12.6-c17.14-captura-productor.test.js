'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');

describe('E12.6-C.17.14 — Captura del Productor Causal de <p></p> vacíos', () => {

    test('Identifica exactamente qué objetos y llamadas al renderer producen cadenas "<p></p>" vacías', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        // 1. Ingestión, Adaptación y Compilación
        const adaptado = adaptarInDesign({ jsonCrudo });
        const resultadoCompilacion = compilarLexmotor(adaptado.ast);

        // 2. Instrumentación limpia y controlada de renderizarNodo (emulando la lógica de constructorXHTML)
        const registroLlamadas = [];
        let contadorLlamadas = 0;

        // Función auxiliar del PresentationResolver (recreada idénticamente a la producción)
        const { PresentationResolver } = require('../../src/resolucion/PresentationResolver');
        const presentationResolver = new PresentationResolver();

        const instrumentarRenderizarNodo = (nodo) => {
            if (!nodo || typeof nodo !== 'object') {
                return typeof nodo === 'string' ? nodo : '';
            }

            contadorLlamadas++;
            const idLlamada = contadorLlamadas;

            const tag = nodo.resolvedTag || 'p';
            
            let classAttr = '';
            if (nodo.resolvedClass && typeof nodo.resolvedClass === 'string') {
                classAttr = nodo.resolvedClass.trim();
            } else {
                const presClass = presentationResolver.resolve(nodo) || '';
                const semClass = nodo.claseLegal || nodo.claseSemantica || '';
                classAttr = [presClass, semClass].filter(Boolean).join(' ').trim();
            }

            let contenidoHtml = '';
            if (nodo.texto && typeof nodo.texto === 'string') {
                contenidoHtml = nodo.texto;
            }

            if (nodo.contenido && Array.isArray(nodo.contenido)) {
                contenidoHtml = nodo.contenido.map(hijo => instrumentarRenderizarNodo(hijo)).join('');
            }

            const resultadoHtml = !classAttr 
                ? `<${tag}>${contenidoHtml}</${tag}>\n` 
                : `<${tag} class="${classAttr}">${contenidoHtml}</${tag}>\n`;

            const esVacio = contenidoHtml.trim() === '';
            const esFallbackP = (tag === 'p' && !nodo.resolvedTag);

            if (esVacio && esFallbackP) {
                registroLlamadas.push({
                    idLlamada,
                    tipo: nodo.tipo || null,
                    tipoNodo: nodo.tipoNodo || null,
                    inDesignStyle: nodo.inDesignStyle || null,
                    resolvedTag: nodo.resolvedTag || null,
                    claseSemantica: nodo.claseSemantica || null,
                    texto: nodo.texto || null,
                    tieneContenidoHijos: Array.isArray(nodo.contenido) && nodo.contenido.length > 0,
                    resultadoHtml: resultadoHtml.trim()
                });
            }

            return resultadoHtml;
        };

        const raizAst = resultadoCompilacion.ast.contenido || resultadoCompilacion.ast;
        if (Array.isArray(raizAst)) {
            raizAst.forEach(instrumentarRenderizarNodo);
        } else {
            instrumentarRenderizarNodo(raizAst);
        }

        console.log('\n====================================================================');
        console.log('   E12.6-C.17.14 — INFORME DEL PRODUCTOR DE <p></p> VACIÓS');
        console.log('====================================================================');
        console.log(`   Total llamadas analizadas       : ${contadorLlamadas}`);
        console.log(`   Total retornos "<p></p>" vacíos : ${registroLlamadas.length}`);
        console.log('--------------------------------------------------------------------');
        
        if (registroLlamadas.length > 0) {
            console.log('   Muestra de los primeros 5 productores capturados:');
            registroLlamadas.slice(0, 5).forEach((prod, i) => {
                console.log(`     [${i + 1}] Llamada #${prod.idLlamada} | Tipo: ${prod.tipo} | TipoNodo: ${prod.tipoNodo} | Estilo: ${prod.inDesignStyle}`);
                console.log(`         Texto: [${prod.texto}] | Hijos: ${prod.tieneContenidoHijos} | HTML: ${prod.resultadoHtml}`);
            });
        }
        console.log('====================================================================\n');

        expect(contadorLlamadas).toBeGreaterThan(0);
    });

});