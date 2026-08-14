'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');

describe('E12.6-C.17.18 — Clasificación Semántica de los 208 Nodos Contenedores', () => {

    test('Analiza si los 208 nodos editoriales principales son hojas o contenedores con sub-elementos', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        // 1. Ingestión, Adaptación y Compilación
        const adaptado = adaptarInDesign({ jsonCrudo });
        const resultadoCompilacion = compilarLexmotor(adaptado.ast);

        let totalEditoriales = 0;
        let editorialesHoja = 0;
        let editorialesContenedores = 0;
        
        const muestrasContenedores = [];

        const auditarNodos = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;

            const esEditorial = typeof nodo.inDesignStyle === 'string' && nodo.inDesignStyle.trim() !== '';

            if (esEditorial) {
                totalEditoriales++;
                const tieneContenidoHijos = Array.isArray(nodo.contenido) && nodo.contenido.length > 0;
                const tieneTextoPropio = typeof nodo.texto === 'string' && nodo.texto.trim() !== '';

                if (tieneContenidoHijos) {
                    editorialesContenedores++;
                    if (muestrasContenedores.length < 10) {
                        muestrasContenedores.push({
                            inDesignStyle: nodo.inDesignStyle,
                            resolvedTag: nodo.resolvedTag || 'p (fallback)',
                            tieneTextoPropio,
                            cantidadHijos: nodo.contenido.length,
                            tiposHijos: nodo.contenido.map(h => h.tipo || h.tipoNodo || 'desconocido')
                        });
                    }
                } else {
                    editorialesHoja++;
                }
            }

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(auditarNodos);
            }
        };

        const raizAst = resultadoCompilacion.ast.contenido || resultadoCompilacion.ast;
        if (Array.isArray(raizAst)) {
            raizAst.forEach(auditarNodos);
        } else {
            auditarNodos(raizAst);
        }

        // 2. Informe Forense en Consola
        console.log('\n====================================================================');
        console.log('   E12.6-C.17.18 — CLASIFICACIÓN SEMÁNTICA DE NODOS EDITORIALES');
        console.log('====================================================================');
        console.log(`   Total nodos editoriales analizados : ${totalEditoriales}`);
        console.log(`   Editoriales tipo HOJA (solo texto) : ${editorialesHoja}`);
        console.log(`   Editoriales tipo CONTENEDOR (hijos): ${editorialesContenedores}`);
        console.log('--------------------------------------------------------------------');
        console.log('   Muestra de la estructura interna de los contenedores:');
        muestrasContenedores.forEach((m, i) => {
            console.log(`     [${i + 1}] Estilo: "${m.inDesignStyle}" | Tag: ${m.resolvedTag} | Texto propio: ${m.tieneTextoPropio}`);
            console.log(`         Hijos (${m.cantidadHijos}): ${JSON.stringify(m.tiposHijos)}`);
        });
        console.log('====================================================================\n');

        expect(totalEditoriales).toBe(208);
        expect(editorialesContenedores + editorialesHoja).toBe(208);
    });

});