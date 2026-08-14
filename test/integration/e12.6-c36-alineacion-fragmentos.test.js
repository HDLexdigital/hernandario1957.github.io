'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');

describe('E12.6-C.36 — Alineación Avanzada de Fragmentos contra Texto Canónico', () => {

    test('Clasifica las 496 fronteras de espacio mediante match directo, normalización de espacios y secuencia posicional', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        // 1. Adaptación y Compilación
        const adaptado = adaptarInDesign({ jsonCrudo });
        const resultadoCompilacion = compilarLexmotor(adaptado.ast);

        let totalFronterasEvaluadas = 0;
        let matchDirecto = 0;
        let matchTrasNormalizacion = 0;
        let matchPorSecuencia = 0;
        let noReconciliablesAlineacion = 0;

        const muestrasAlineacion = [];

        const auditarAlineacionAvanzada = (nodo) => {
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

                    // Verificar si el padre exige espacio semántico globalmente para esta combinación
                    if (textoPadre.includes(unionConEspacio)) {
                        if (textoPadre.includes(unionConcat)) {
                            matchDirecto++;
                        } else {
                            // Intentar match tras normalización básica de espacios internos o diacríticos
                            const padreNorm = textoPadre.replace(/\s+/g, ' ');
                            const aNorm = A.trim();
                            const bNorm = B.trim();
                            const unionNorm = aNorm + ' ' + bNorm;

                            if (padreNorm.includes(unionNorm)) {
                                matchTrasNormalizacion++;
                                if (muestrasAlineacion.length < 5) {
                                    muestrasAlineacion.push({
                                        estilo: nodo.inDesignStyle,
                                        tipo: 'NORMALIZACION',
                                        A: aNorm,
                                        B: bNorm
                                    });
                                }
                            } else {
                                // Verificar si ambos fragmentos aparecen secuencialmente en el padre aunque separados por otros caracteres/marcas
                                const idxA = textoPadre.indexOf(A);
                                const idxB = idxA !== -1 ? textoPadre.indexOf(B, idxA + A.length) : -1;

                                if (idxA !== -1 && idxB !== -1 && idxB - (idxA + A.length) <= 3) {
                                    matchPorSecuencia++;
                                    if (muestrasAlineacion.length < 5) {
                                        muestrasAlineacion.push({
                                            estilo: nodo.inDesignStyle,
                                            tipo: 'SECUENCIA_PROXIMA',
                                            A,
                                            B,
                                            distancia: idxB - (idxA + A.length)
                                        });
                                    }
                                } else {
                                    noReconciliablesAlineacion++;
                                }
                            }
                        }
                    }
                }
            }

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(auditarAlineacionAvanzada);
            }
        };

        const raizAst = resultadoCompilacion.ast.contenido || resultadoCompilacion.ast;
        if (Array.isArray(raizAst)) {
            raizAst.forEach(auditarAlineacionAvanzada);
        } else {
            auditarAlineacionAvanzada(raizAst);
        }

        // Informe Forense en Consola
        console.log('\n====================================================================');
        console.log('   E12.6-C.36 — INFORME DE ALINEACIÓN AVANZADA DE FRONTERAS');
        console.log('====================================================================');
        console.log(`   Total fronteras evaluadas            : ${totalFronterasEvaluadas}`);
        console.log(`   - [A] Match directo literal          : ${matchDirecto}`);
        console.log(`   - [B] Match tras normalización       : ${matchTrasNormalizacion}`);
        console.log(`   - [C] Match por secuencia próxima    : ${matchPorSecuencia}`);
        console.log(`   - [D] No reconciliables por alineación: ${noReconciliablesAlineacion}`);
        console.log('--------------------------------------------------------------------');

        if (muestrasAlineacion.length > 0) {
            console.log('   Muestra de casos resueltos por alineación avanzada:');
            muestrasAlineacion.forEach((m, idx) => {
                console.log(`     [${idx + 1}] Tipo: ${m.tipo} | Estilo: "${m.estilo}" | A: "${m.A}" + B: "${m.B}"`);
            });
        }
        console.log('====================================================================\n');

        expect(totalFronterasEvaluadas).toBeGreaterThan(0);
    });

});