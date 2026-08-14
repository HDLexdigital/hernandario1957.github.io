'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');

describe('E12.6-C.35 — Reconciliación Exhaustiva de las 496 Fronteras y Proveniencia', () => {

    test('Clasifica de forma exhaustiva las 496 fronteras de espacio según su presencia en el JSON crudo y el texto padre', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        // 1. Adaptación y Compilación
        const adaptado = adaptarInDesign({ jsonCrudo });
        const resultadoCompilacion = compilarLexmotor(adaptado.ast);

        let totalFronterasEvaluadas = 0;
        let fronterasConEspacioEnPadre = 0;
        let recuperablesPorPadre = 0;
        let noReconciliables = 0;

        const muestrasReconciliacionExhaustiva = [];

        const auditarFronterasExhaustivas = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;

            const esEditorial = typeof nodo.inDesignStyle === 'string' && nodo.inDesignStyle.trim() !== '';
            const tieneHijos = Array.isArray(nodo.contenido) && nodo.contenido.length > 1;

            if (esEditorial && tieneHijos) {
                const textoPadre = nodo.texto || '';
                const hijos = nodo.contenido;

                for (let i = 0; i < hijos.length - 1; i++) {
                    const A = hijos[i].texto || '';
                    const B = hijos[i + 1].texto || '';

                    if (A.length === 0 || B.length === 0) continue;

                    totalFronterasEvaluadas++;

                    const unionConcat = A + B;
                    const unionConEspacio = A + ' ' + B;

                    // Verificar si el padre exige espacio en esta frontera
                    if (textoPadre.includes(unionConEspacio)) {
                        fronterasConEspacioEnPadre++;

                        // Verificar si la concatenación directa carece del espacio
                        if (!unionConcat.includes(' ')) {
                            recuperablesPorPadre++;

                            if (muestrasReconciliacionExhaustiva.length < 6) {
                                muestrasReconciliacionExhaustiva.push({
                                    estilo: nodo.inDesignStyle,
                                    fragmentoA: A,
                                    fragmentoB: B,
                                    contextoPadre: textoPadre.substring(Math.max(0, textoPadre.indexOf(unionConEspacio) - 5), Math.min(textoPadre.length, textoPadre.indexOf(unionConEspacio) + unionConEspacio.length + 5))
                                });
                            }
                        }
                    } else if (!textoPadre.includes(unionConcat)) {
                        noReconciliables++;
                    }
                }
            }

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(auditarFronterasExhaustivas);
            }
        };

        const raizAst = resultadoCompilacion.ast.contenido || resultadoCompilacion.ast;
        if (Array.isArray(raizAst)) {
            raizAst.forEach(auditarFronterasExhaustivas);
        } else {
            auditarFronterasExhaustivas(raizAst);
        }

        // Informe Forense en Consola
        console.log('\n====================================================================');
        console.log('   E12.6-C.35 — INFORME DE RECONCILIACIÓN EXHAUSTIVA');
        console.log('====================================================================');
        console.log(`   Total fronteras evaluadas (en 163 cont.): ${totalFronterasEvaluadas}`);
        console.log(`   - Fronteras con espacio semántico en Padre: ${fronterasConEspacioEnPadre}`);
        console.log(`   - Fronteras recuperables vía texto Padre  : ${recuperablesPorPadre}`);
        console.log(`   - Fronteras no reconciliables directas    : ${noReconciliables}`);
        console.log('--------------------------------------------------------------------');

        if (muestrasReconciliacionExhaustiva.length > 0) {
            console.log('   Muestra de reconciliación exhaustiva confirmada:');
            muestrasReconciliacionExhaustiva.forEach((m, idx) => {
                console.log(`     [${idx + 1}] Estilo: "${m.estilo}" | A: "${m.fragmentoA}" + B: "${m.fragmentoB}"`);
                console.log(`         Contexto canónico en Padre: "...${m.contextoPadre}..."`);
            });
        }
        console.log('====================================================================\n');

        expect(totalFronterasEvaluadas).toBeGreaterThan(0);
        expect(recuperablesPorPadre).toBe(496);
    });

});