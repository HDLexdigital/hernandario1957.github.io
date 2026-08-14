'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');

describe('E12.6-C.17.23 — Auditoría de Semántica Textual del Contenedor (Padre ↔ Hijos)', () => {

    test('Clasifica las divergencias textuales entre el texto del contenedor y la concatenación de sus hijos', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        // 1. Ingestión, Adaptación y Compilación
        const adaptado = adaptarInDesign({ jsonCrudo });
        const resultadoCompilacion = compilarLexmotor(adaptado.ast);

        let totalContenedores = 0;
        let catIdentica = 0;
        let catWhitespace = 0;
        let catSegmentacion = 0;
        let catDivergenciaReal = 0;

        const muestrasDivergenciaReal = [];

        const auditarSemanticaTextual = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;

            const esEditorial = typeof nodo.inDesignStyle === 'string' && nodo.inDesignStyle.trim() !== '';
            const tieneHijos = Array.isArray(nodo.contenido) && nodo.contenido.length > 0;

            if (esEditorial && tieneHijos) {
                totalContenedores++;
                const textoPadre = nodo.texto || '';
                const textosHijos = nodo.contenido.map(h => h.texto || '').join('');

                if (textoPadre === textosHijos) {
                    catIdentica++;
                } else {
                    // Normalizamos espacios múltiples para ver si la diferencia es puramente de whitespace/saltos
                    const padreNorm = textoPadre.replace(/\s+/g, ' ').trim();
                    const hijosNorm = textosHijos.replace(/\s+/g, ' ').trim();

                    if (padreNorm === hijosNorm) {
                        catWhitespace++;
                    } else {
                        // Verificamos si la diferencia se debe a espacios colapsados en los límites de unión (ej. "su" + "soberanía" vs "susoberanía")
                        const padreSinEspacios = padreNorm.replace(/\s/g, '');
                        const hijosSinEspacios = hijosNorm.replace(/\s/g, '');

                        if (padreSinEspacios === hijosSinEspacios) {
                            catSegmentacion++;
                        } else {
                            catDivergenciaReal++;
                            if (muestrasDivergenciaReal.length < 5) {
                                muestrasDivergenciaReal.push({
                                    estilo: nodo.inDesignStyle,
                                    padre: padreNorm.substring(0, 45),
                                    hijos: hijosNorm.substring(0, 45)
                                });
                            }
                        }
                    }
                }
            }

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(auditarSemanticaTextual);
            }
        };

        const raizAst = resultadoCompilacion.ast.contenido || resultadoCompilacion.ast;
        if (Array.isArray(raizAst)) {
            raizAst.forEach(auditarSemanticaTextual);
        } else {
            auditarSemanticaTextual(raizAst);
        }

        // 2. Informe Estadístico en Consola
        console.log('\n====================================================================');
        console.log('   E12.6-C.17.23 — CLASIFICACIÓN SEMÁNTICA TEXTUAL PADRE ↔ HIJOS');
        console.log('====================================================================');
        console.log(`   Total contenedores auditados           : ${totalContenedores}`);
        console.log(`   [A] Identidad exacta (Padre == Hijos)  : ${catIdentica}`);
        console.log(`   [B] Diferencia exclusiva por whitespace: ${catWhitespace}`);
        console.log(`   [C] Diferencia por segmentación/espacios : ${catSegmentacion}`);
        console.log(`   [D] Divergencia semántica real         : ${catDivergenciaReal}`);
        console.log('--------------------------------------------------------------------');
        
        if (muestrasDivergenciaReal.length > 0) {
            console.log('   Muestra de casos con divergencia semántica real:');
            muestrasDivergenciaReal.forEach((m, idx) => {
                console.log(`     [${idx + 1}] Estilo: "${m.estilo}"`);
                console.log(`         Padre: "${m.padre}"`);
                console.log(`         Hijos: "${m.hijos}"`);
            });
        }
        console.log('====================================================================\n');

        expect(totalContenedores).toBe(208);
    });

});