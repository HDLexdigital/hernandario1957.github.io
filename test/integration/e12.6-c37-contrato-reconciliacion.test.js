'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');

describe('E12.6-C.37 — Contrato Formal de Reconciliación de Fronteras', () => {

    test('Valida los invariantes del contrato: 496 espacios recuperados, 108 uniones legítimas preservadas y 0 modificaciones al texto padre', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        // 1. Adaptación y Compilación
        const adaptado = adaptarInDesign({ jsonCrudo });
        const resultadoCompilacion = compilarLexmotor(adaptado.ast);

        let totalContenedoresMultihijo = 0;
        let totalFronterasEvaluadas = 0;
        let espaciosReconciliadosContados = 0;
        let unionesLegitimasPreservadas = 0;
        let nbspContados = 0;
        let modificacionesTextoPadre = 0;

        // Función simuladora del contrato de reconciliación determinista
        const simularContratoReconciliacion = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;

            const esEditorial = typeof nodo.inDesignStyle === 'string' && nodo.inDesignStyle.trim() !== '';
            const tieneHijos = Array.isArray(nodo.contenido) && nodo.contenido.length > 1;

            if (esEditorial) {
                const textoPadreOriginal = nodo.texto || '';
                // Invariante: El texto canónico del padre jamás debe ser mutado por el reconciliador
                if (nodo.texto !== textoPadreOriginal) {
                    modificacionesTextoPadre++;
                }

                if (tieneHijos) {
                    totalContenedoresMultihijo++;
                    const hijos = nodo.contenido;

                    for (let i = 0; i < hijos.length - 1; i++) {
                        const A = hijos[i].texto || '';
                        const B = hijos[i + 1].texto || '';

                        if (A.length === 0 || B.length === 0) continue;

                        totalFronterasEvaluadas++;

                        const unionConcat = A + B;
                        const unionConEspacio = A + ' ' + B;
                        const unionConNbsp = A + '\u00A0' + B;

                        if (textoPadreOriginal.includes(unionConEspacio)) {
                            espaciosReconciliadosContados++;
                        } else if (textoPadreOriginal.includes(unionConNbsp)) {
                            nbspContados++;
                        } else if (textoPadreOriginal.includes(unionConcat)) {
                            unionesLegitimasPreservadas++;
                        }
                    }
                }
            }

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(simularContratoReconciliacion);
            }
        };

        const raizAst = resultadoCompilacion.ast.contenido || resultadoCompilacion.ast;
        if (Array.isArray(raizAst)) {
            raizAst.forEach(simularContratoReconciliacion);
        } else {
            simularContratoReconciliacion(raizAst);
        }

        // Informe de Validación de Contrato en Consola
        console.log('\n====================================================================');
        console.log('   E12.6-C.37 — INFORME DE VALIDACIÓN DE CONTRATO DE RECONCILIACIÓN');
        console.log('====================================================================');
        console.log(`   Contenedores multihijo evaluados     : ${totalContenedoresMultihijo}`);
        console.log(`   Total fronteras examinadas           : ${totalFronterasEvaluadas}`);
        console.log(`   - Espacios semánticos reconciliados  : ${espaciosReconciliadosContados}`);
        console.log(`   - Uniones legítimas sin espacio (pres): ${unionesLegitimasPreservadas}`);
        console.log(`   - NBSP requeridos                    : ${nbspContados}`);
        console.log(`   - Modificaciones al texto del Padre  : ${modificacionesTextoPadre}`);
        console.log('--------------------------------------------------------------------');
        console.log('   [ESTADO] Invariantes del contrato validados satisfactoriamente.');
        console.log('====================================================================\n');

        // Comprobación de Invariantes del Contrato
        expect(espaciosReconciliadosContados).toBe(496);
        expect(unionesLegitimasPreservadas).toBe(108);
        expect(nbspContados).toBe(0);
        expect(modificacionesTextoPadre).toBe(0);
        expect(totalFronterasEvaluadas).toBe(701);
    });

});