'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');

describe('E12.6-C.34 — Auditoría del Universo y Contabilidad de Contenedores', () => {

    test('Clasifica de forma exacta la contabilidad de los 208 contenedores y explica los motivos de exclusión', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        const adaptado = adaptarInDesign({ jsonCrudo });
        const resultadoCompilacion = compilarLexmotor(adaptado.ast);

        let totalContenedoresDetectados = 0;
        let contSinHijos = 0;
        let contConUnHijo = 0;
        let contSinTextoPadre = 0;
        let contVerificadosConMultiplesHijos = 0;
        let fronterasEvaluadasConEspacio = 0;

        const muestrasExcluidos = [];

        const auditarUniverso = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;

            const esEditorial = typeof nodo.inDesignStyle === 'string' && nodo.inDesignStyle.trim() !== '';

            if (esEditorial) {
                totalContenedoresDetectados++;
                const textoPadre = (nodo.texto || '').trim();
                const tieneHijos = Array.isArray(nodo.contenido) && nodo.contenido.length > 0;
                const cantidadHijos = tieneHijos ? nodo.contenido.length : 0;

                if (!textoPadre) {
                    contSinTextoPadre++;
                } else if (!tieneHijos) {
                    contSinHijos++;
                    if (muestrasExcluidos.length < 5) {
                        muestrasExcluidos.push({ estilo: nodo.inDesignStyle, motivo: 'SIN_HIJOS' });
                    }
                } else if (cantidadHijos === 1) {
                    contConUnHijo++;
                    if (muestrasExcluidos.length < 5) {
                        muestrasExcluidos.push({ estilo: nodo.inDesignStyle, motivo: 'UN_SOLO_HIJO' });
                    }
                } else {
                    contVerificadosConMultiplesHijos++;
                    // Evaluar fronteras para los que tienen múltiples hijos
                    const hijos = nodo.contenido;
                    for (let i = 0; i < hijos.length - 1; i++) {
                        const A = hijos[i].texto || '';
                        const B = hijos[i + 1].texto || '';
                        if (A.length > 0 && B.length > 0) {
                            if (textoPadre.includes(A + ' ' + B)) {
                                fronterasEvaluadasConEspacio++;
                            }
                        }
                    }
                }
            }

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(auditarUniverso);
            }
        };

        const raizAst = resultadoCompilacion.ast.contenido || resultadoCompilacion.ast;
        if (Array.isArray(raizAst)) {
            raizAst.forEach(auditarUniverso);
        } else {
            auditarUniverso(raizAst);
        }

        // Informe Forense de Contabilidad en Consola
        console.log('\n====================================================================');
        console.log('   E12.6-C.34 — INFORME DE CONTABILIDAD Y UNIVERSO DE CONTENEDORES');
        console.log('====================================================================');
        console.log(`   Total contenedores editoriales detectados : ${totalContenedoresDetectados}`);
        console.log(`   - Contenedores sin hijos                  : ${contSinHijos}`);
        console.log(`   - Contenedores con un solo hijo           : ${contConUnHijo}`);
        console.log(`   - Contenedores sin texto propio (padre)   : ${contSinTextoPadre}`);
        console.log(`   - Contenedores con múltiples hijos (eval): ${contVerificadosConMultiplesHijos}`);
        console.log(`   Suma de control (Excluidos + Evaluados)   : ${contSinHijos + contConUnHijo + contSinTextoPadre + contVerificadosConMultiplesHijos}`);
        console.log(`   Fronteras con espacio semántico detectadas: ${fronterasEvaluadasConEspacio}`);
        console.log('--------------------------------------------------------------------');
        console.log(`   Expectativa global del sistema (baseline) : 208`);
        console.log('====================================================================\n');

        expect(totalContenedoresDetectados).toBe(208);
        expect(contSinHijos + contConUnHijo + contSinTextoPadre + contVerificadosConMultiplesHijos).toBe(208);
    });

});