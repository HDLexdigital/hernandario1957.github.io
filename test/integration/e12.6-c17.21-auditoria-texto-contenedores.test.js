'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');

describe('E12.6-C.17.21 — Auditoría de Texto Propio frente a Contenido en Nodos Contenedores', () => {

    test('Analiza la coexistencia y relación entre nodo.texto y nodo.contenido en los 208 contenedores', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        // 1. Ingestión, Adaptación y Compilación
        const adaptado = adaptarInDesign({ jsonCrudo });
        const resultadoCompilacion = compilarLexmotor(adaptado.ast);

        let totalContenedores = 0;
        let conTextoVacio = 0;
        let conTextoNoVacio = 0;
        let textoIgualAlHijoUnico = 0;
        let textoDistintoDelHijoUnico = 0;
        let conMultiplesHijos = 0;

        const muestras = [];

        const auditarTextoContenedores = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;

            const esEditorial = typeof nodo.inDesignStyle === 'string' && nodo.inDesignStyle.trim() !== '';
            const tieneHijos = Array.isArray(nodo.contenido) && nodo.contenido.length > 0;

            if (esEditorial && tieneHijos) {
                totalContenedores++;
                const textoPropio = (nodo.texto || '').trim();
                const cantidadHijos = nodo.contenido.length;

                if (textoPropio === '') {
                    conTextoVacio++;
                } else {
                    conTextoNoVacio++;
                }

                if (cantidadHijos === 1) {
                    const hijoUnico = nodo.contenido[0];
                    const textoHijo = (hijoUnico.texto || '').trim();

                    if (textoPropio !== '') {
                        if (textoPropio === textoHijo) {
                            textoIgualAlHijoUnico++;
                        } else {
                            textoDistintoDelHijoUnico++;
                        }
                    }
                } else {
                    conMultiplesHijos++;
                }

                if (muestras.length < 12) {
                    muestras.push({
                        estilo: nodo.inDesignStyle,
                        longitudTextoPropio: textoPropio.length,
                        extractoTextoPropio: textoPropio.substring(0, 35),
                        cantidadHijos,
                        primerHijoTexto: cantidadHijos > 0 ? (nodo.contenido[0].texto || '').trim().substring(0, 35) : '[sin-texto]'
                    });
                }
            }

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(auditarTextoContenedores);
            }
        };

        const raizAst = resultadoCompilacion.ast.contenido || resultadoCompilacion.ast;
        if (Array.isArray(raizAst)) {
            raizAst.forEach(auditarTextoContenedores);
        } else {
            auditarTextoContenedores(raizAst);
        }

        // 2. Informe Forense en Consola
        console.log('\n====================================================================');
        console.log('   E12.6-C.17.21 — AUDITORÍA DE TEXTO PROPIO VS HIJOS EN CONTENEDORES');
        console.log('====================================================================');
        console.log(`   Total contenedores analizados       : ${totalContenedores}`);
        console.log(`   Contenedores con texto propio vacío : ${conTextoVacio}`);
        console.log(`   Contenedores con texto propio activo: ${conTextoNoVacio}`);
        console.log(`   - Hijo único con texto IDÉNTICO     : ${textoIgualAlHijoUnico}`);
        console.log(`   - Hijo único con texto DISTINTO     : ${textoDistintoDelHijoUnico}`);
        console.log(`   - Contenedores con MÚLTIPLES hijos  : ${conMultiplesHijos}`);
        console.log('--------------------------------------------------------------------');
        console.log('   Muestra de los primeros contenedores auditados:');
        muestras.forEach((m, i) => {
            console.log(`     [${i + 1}] Estilo: "${m.estilo}" | Hijos: ${m.cantidadHijos} | Long. Texto: ${m.longitudTextoPropio}`);
            console.log(`         Texto Propio : "${m.extractoTextoPropio}"`);
            console.log(`         Texto 1º Hijo: "${m.primerHijoTexto}"`);
        });
        console.log('====================================================================\n');

        expect(totalContenedores).toBe(208);
    });

});