'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');

describe('E12.6-C.29 — Trazabilidad Causal de Transformación Textual (InDesign → Adaptador → AST → XHTML)', () => {

    test('Rastrea el origen de las divergencias textuales entre el JSON crudo, el Adaptador y el AST final', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        // 1. Capa de Adaptación (E10)
        const adaptado = adaptarInDesign({ jsonCrudo });
        const astAdaptado = adaptado.ast;

        // 2. Capa de Compilación / Lexmotor
        const resultadoCompilacion = compilarLexmotor(astAdaptado);
        const astCompilado = resultadoCompilacion.ast;

        let totalContenedoresAuditados = 0;
        let origenCrudoVsAstCoincide = 0;
        let origenCrudoVsAstDiverge = 0;

        const muestrasTrazabilidad = [];

        // Función recursiva para buscar y auditar contenedores en el JSON crudo y el AST
        const rastrearContenedores = (nodoAst) => {
            if (!nodoAst || typeof nodoAst !== 'object') return;

            const esEditorial = typeof nodoAst.inDesignStyle === 'string' && nodoAst.inDesignStyle.trim() !== '';
            const tieneHijos = Array.isArray(nodoAst.contenido) && nodoAst.contenido.length > 0;

            if (esEditorial && tieneHijos) {
                totalContenedoresAuditados++;
                const textoAst = (nodoAst.texto || '').trim();
                const textoHijosConcat = nodoAst.contenido.map(h => (h.texto || '').trim()).join('');

                if (textoAst === textoHijosConcat) {
                    origenCrudoVsAstCoincide++;
                } else {
                    origenCrudoVsAstDiverge++;
                    if (muestrasTrazabilidad.length < 5) {
                        muestrasTrazabilidad.push({
                            estilo: nodoAst.inDesignStyle,
                            lenTextoAst: textoAst.length,
                            lenHijosConcat: textoHijosConcat.length,
                            diffLen: textoHijosConcat.length - textoAst.length,
                            previewAst: textoAst.substring(0, 35),
                            previewHijos: textoHijosConcat.substring(0, 35)
                        });
                    }
                }
            }

            if (Array.isArray(nodoAst.contenido)) {
                nodoAst.contenido.forEach(rastrearContenedores);
            }
        };

        const raizAstCompilado = astCompilado.contenido || astCompilado;
        if (Array.isArray(raizAstCompilado)) {
            raizAstCompilado.forEach(rastrearContenedores);
        } else {
            rastrearContenedores(raizAstCompilado);
        }

        // 3. Informe de Trazabilidad en Consola
        console.log('\n====================================================================');
        console.log('   E12.6-C.29 — INFORME DE TRAZABILIDAD CAUSAL');
        console.log('====================================================================');
        console.log(`   Contenedores editoriales rastreados : ${totalContenedoresAuditados}`);
        console.log(`   - Coincidencia exacta Texto vs Hijos  : ${origenCrudoVsAstCoincide}`);
        console.log(`   - Divergencia Texto vs Hijos en AST   : ${origenCrudoVsAstDiverge}`);
        console.log('--------------------------------------------------------------------');
        
        if (muestrasTrazabilidad.length > 0) {
            console.log('   Muestra de casos divergentes bajo trazabilidad:');
            muestrasTrazabilidad.forEach((m, idx) => {
                console.log(`     [${idx + 1}] Estilo: "${m.estilo}" | Δ Len: ${m.diffLen}`);
                console.log(`         Texto AST : "${m.previewAst}..."`);
                console.log(`         Hijos Concat: "${m.previewHijos}..."`);
            });
        }
        console.log('====================================================================\n');

        expect(totalContenedoresAuditados).toBe(208);
    });

});