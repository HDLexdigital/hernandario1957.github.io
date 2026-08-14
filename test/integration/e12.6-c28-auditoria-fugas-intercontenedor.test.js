'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');

describe('E12.6-C.28 — Auditoría de Cobertura y Fugas Intercontenedor', () => {

    test('Analiza la relación textual detallada, detecta fugas, omisiones y diferencias de cobertura entre padre e hijos', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        // 1. Ingestión, Adaptación y Compilación
        const adaptado = adaptarInDesign({ jsonCrudo });
        const resultadoCompilacion = compilarLexmotor(adaptado.ast);

        let totalContenedores = 0;
        let casosIdenticos = 0;
        let hijosMayorQuePadre = 0;
        let padreMayorQueHijos = 0;
        let posiblesFugasDetectadas = 0;

        const muestrasFugas = [];

        const auditarFugas = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;

            const esEditorial = typeof nodo.inDesignStyle === 'string' && nodo.inDesignStyle.trim() !== '';
            const tieneHijos = Array.isArray(nodo.contenido) && nodo.contenido.length > 0;

            if (esEditorial && tieneHijos) {
                totalContenedores++;
                const textoPadre = (nodo.texto || '').trim();
                const textosHijosConcatenados = nodo.contenido.map(h => (h.texto || '').trim()).join('');

                const lenPadre = textoPadre.length;
                const lenHijos = textosHijosConcatenados.length;

                if (textoPadre === textosHijosConcatenados) {
                    casosIdenticos++;
                } else if (lenHijos > lenPadre) {
                    hijosMayorQuePadre++;
                    // Si los hijos tienen más longitud, podría indicar una fuga o solapamiento con texto externo
                    if (textosHijosConcatenados.includes('Artículo') && !textoPadre.includes('Artículo')) {
                        posiblesFugasDetectadas++;
                    }
                } else {
                    padreMayorQueHijos++;
                }

                if (muestrasFugas.length < 6 && lenHijos !== lenPadre) {
                    muestrasFugas.push({
                        estilo: nodo.inDesignStyle,
                        traceId: nodo.__traceId || 'sin-traza',
                        lenPadre,
                        lenHijos,
                        diffLongitud: lenHijos - lenPadre,
                        previewPadre: textoPadre.substring(0, 40),
                        previewHijos: textosHijosConcatenados.substring(0, 40)
                    });
                }
            }

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(auditarFugas);
            }
        };

        const raizAst = resultadoCompilacion.ast.contenido || resultadoCompilacion.ast;
        if (Array.isArray(raizAst)) {
            raizAst.forEach(auditarFugas);
        } else {
            auditarFugas(raizAst);
        }

        // 2. Informe Forense en Consola
        console.log('\n====================================================================');
        console.log('   E12.6-C.28 — INFORME DE COBERTURA Y FUGAS INTERCONTENEDOR');
        console.log('====================================================================');
        console.log(`   Contenedores analizados           : ${totalContenedores}`);
        console.log(`   - Casos idénticos (Padre == Hijos): ${casosIdenticos}`);
        console.log(`   - Hijos más largos que el padre   : ${hijosMayorQuePadre}`);
        console.log(`   - Padre más largo que los hijos   : ${padreMayorQueHijos}`);
        console.log(`   - Posibles fugas semánticas (ej. Artíc): ${posiblesFugasDetectadas}`);
        console.log('--------------------------------------------------------------------');
        
        if (muestrasFugas.length > 0) {
            console.log('   Muestra de diferencias de longitud entre padre e hijos:');
            muestrasFugas.forEach((m, idx) => {
                console.log(`     [${idx + 1}] Estilo: "${m.estilo}" | Δ Len: ${m.diffLongitud} (Padre: ${m.lenPadre} vs Hijos: ${m.lenHijos})`);
                console.log(`         Padre: "${m.previewPadre}..."`);
                console.log(`         Hijos: "${m.previewHijos}..."`);
            });
        }
        console.log('====================================================================\n');

        expect(totalContenedores).toBe(208);
    });

});