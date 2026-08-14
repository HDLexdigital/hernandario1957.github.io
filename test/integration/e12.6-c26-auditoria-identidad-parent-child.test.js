'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');

describe('E12.6-C.26 — Auditoría de Identidad Parent/Child (Contenedores vs Hijos)', () => {

    test('Clasifica la relación estructural y textual entre cada contenedor y sus hijos internos', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        // 1. Ingestión, Adaptación y Compilación
        const adaptado = adaptarInDesign({ jsonCrudo });
        const resultadoCompilacion = compilarLexmotor(adaptado.ast);

        let totalContenedores = 0;
        let clasificacionA = 0; // Hijo = representación segmentada del padre
        let clasificacionB = 0; // Hijo = verdadero bloque editorial independiente
        let clasificacionC = 0; // Hijo = duplicación exacta o redundante
        let clasificacionD = 0; // Relación estructural legítima (múltiples hijos que componen el texto)
        let clasificacionE = 0; // Ambiguos / otros

        const muestrasClasificadas = [];

        const auditarRelacionParentChild = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;

            const esEditorial = typeof nodo.inDesignStyle === 'string' && nodo.inDesignStyle.trim() !== '';
            const tieneHijos = Array.isArray(nodo.contenido) && nodo.contenido.length > 0;

            if (esEditorial && tieneHijos) {
                totalContenedores++;
                const textoPadre = (nodo.texto || '').trim();
                const cantidadHijos = nodo.contenido.length;
                const textosHijosConcatenados = nodo.contenido.map(h => (h.texto || '').trim()).join('');

                const padreNorm = textoPadre.replace(/\s+/g, ' ');
                const hijosNorm = textosHijosConcatenados.replace(/\s+/g, ' ');

                let tipoClasificacion = '';

                if (cantidadHijos === 1) {
                    if (padreNorm === hijosNorm) {
                        clasificacionC++;
                        tipoClasificacion = 'C - Duplicación exacta';
                    } else if (padreNorm.includes(hijosNorm) || hijosNorm.includes(padreNorm)) {
                        clasificacionA++;
                        tipoClasificacion = 'A - Segmentación parcial';
                    } else {
                        clasificacionE++;
                        tipoClasificacion = 'E - Ambiguo / Diferente';
                    }
                } else {
                    // Múltiples hijos
                    if (padreNorm.replace(/\s/g, '') === hijosNorm.replace(/\s/g, '')) {
                        clasificacionA++;
                        tipoClasificacion = 'A - Segmentada (múltiples fragmentos)';
                    } else {
                        clasificacionD++;
                        tipoClasificacion = 'D - Estructural legítima / Múltiples bloques';
                    }
                }

                if (muestrasClasificadas.length < 8) {
                    muestrasClasificadas.push({
                        estilo: nodo.inDesignStyle,
                        clasificacion: tipoClasificacion,
                        cantidadHijos,
                        textoPadrePreview: padreNorm.substring(0, 35),
                        textoHijosPreview: hijosNorm.substring(0, 35)
                    });
                }
            }

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(auditarRelacionParentChild);
            }
        };

        const raizAst = resultadoCompilacion.ast.contenido || resultadoCompilacion.ast;
        if (Array.isArray(raizAst)) {
            raizAst.forEach(auditarRelacionParentChild);
        } else {
            auditarRelacionParentChild(raizAst);
        }

        // 2. Informe Forense en Consola
        console.log('\n====================================================================');
        console.log('   E12.6-C.26 — INFORME DE IDENTIDAD PARENT / CHILD');
        console.log('====================================================================');
        console.log(`   Total contenedores analizados          : ${totalContenedores}`);
        console.log(`   [A] Segmentación / Fragmentación       : ${clasificacionA}`);
        console.log(`   [B] Bloques editoriales independientes : ${clasificacionB}`);
        console.log(`   [C] Duplicación exacta                 : ${clasificacionC}`);
        console.log(`   [D] Múltiples fragmentos / Estructural : ${clasificacionD}`);
        console.log(`   [E] Casos ambiguos                     : ${clasificacionE}`);
        console.log('--------------------------------------------------------------------');
        console.log('   Muestras del análisis relacional:');
        muestrasClasificadas.forEach((m, idx) => {
            console.log(`     [${idx + 1}] Estilo: "${m.estilo}" | Cls: ${m.clasificacion} | Hijos: ${m.cantidadHijos}`);
            console.log(`         Padre: "${m.textoPadrePreview}"`);
            console.log(`         Hijos: "${m.textoHijosPreview}"`);
        });
        console.log('====================================================================\n');

        expect(totalContenedores).toBe(208);
    });

});