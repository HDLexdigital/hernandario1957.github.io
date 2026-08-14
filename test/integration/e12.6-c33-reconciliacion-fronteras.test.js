'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');

describe('E12.6-C.33 — Reconciliación de Fronteras y Proveniencia (JSON Crudo vs AST)', () => {

    test('Verifica si los fragmentos originales en el JSON crudo ya carecían del espacio o si el adaptador omitió la frontera', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        // 1. Adaptación
        const adaptado = adaptarInDesign({ jsonCrudo });
        const resultadoCompilacion = compilarLexmotor(adaptado.ast);

        let totalContenedoresVerificados = 0;
        let fronterasConEspacioEnPadrePerdidoEnHijos = 0;
        let muestrasReconciliacion = [];

        // Función recursiva para auditar el AST y contrastarlo con el origen crudo
        const auditarReconciliacion = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;

            const esEditorial = typeof nodo.inDesignStyle === 'string' && nodo.inDesignStyle.trim() !== '';
            const tieneHijos = Array.isArray(nodo.contenido) && nodo.contenido.length > 1;

            if (esEditorial && tieneHijos) {
                totalContenedoresVerificados++;
                const textoPadre = nodo.texto || '';
                const hijos = nodo.contenido;

                for (let i = 0; i < hijos.length - 1; i++) {
                    const A = hijos[i].texto || '';
                    const B = hijos[i + 1].texto || '';

                    if (A.length === 0 || B.length === 0) continue;

                    const unionConcat = A + B;
                    const unionConEspacio = A + ' ' + B;

                    // Si el padre contiene la forma con espacio, pero la concatenación directa no,
                    // confirmamos que el espacio existía a nivel semántico/padre pero se perdió en la frontera de hijos.
                    if (textoPadre.includes(unionConEspacio) && !unionConcat.includes(' ')) {
                        fronterasConEspacioEnPadrePerdidoEnHijos++;

                        if (muestrasReconciliacion.length < 5) {
                            muestrasReconciliacion.push({
                                estilo: nodo.inDesignStyle,
                                A,
                                B,
                                unionEsperadaEnPadre: unionConEspacio.substring(Math.max(0, unionConEspacio.indexOf(A) - 5), Math.min(unionConEspacio.length, unionConEspacio.indexOf(B) + B.length + 5))
                            });
                        }
                    }
                }
            }

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(auditarReconciliacion);
            }
        };

        const raizAst = resultadoCompilacion.ast.contenido || resultadoCompilacion.ast;
        if (Array.isArray(raizAst)) {
            raizAst.forEach(auditarReconciliacion);
        } else {
            auditarReconciliacion(raizAst);
        }

        // 2. Informe Forense en Consola
        console.log('\n====================================================================');
        console.log('   E12.6-C.33 — INFORME DE RECONCILIACIÓN DE FRONTERAS');
        console.log('====================================================================');
        console.log(`   Contenedores editoriales verificados     : ${totalContenedoresVerificados}`);
        console.log(`   Fronteras con espacio semántico en Padre : ${fronterasConEspacioEnPadrePerdidoEnHijos}`);
        console.log('--------------------------------------------------------------------');

        if (muestrasReconciliacion.length > 0) {
            console.log('   Muestra de reconciliación de frontera perdida:');
            muestrasReconciliacion.forEach((m, idx) => {
                console.log(`     [${idx + 1}] Estilo: "${m.estilo}"`);
                console.log(`         Hijo A: "${m.A}" | Hijo B: "${m.B}"`);
                console.log(`         Contexto en Padre: "...${m.unionEsperadaEnPadre}..."`);
            });
        }
        console.log('====================================================================\n');

        expect(totalContenedoresVerificados).toBe(208);
    });

});