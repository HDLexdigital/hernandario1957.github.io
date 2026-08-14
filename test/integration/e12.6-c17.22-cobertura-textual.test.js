'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');

describe('E12.6-C.17.22 — Auditoría de Cobertura Textual Padre ↔ Fragmentos Hijos', () => {

    test('Mide y clasifica la relación textual entre el texto propio del contenedor y la concatenación de sus hijos', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        // 1. Ingestión, Adaptación y Compilación
        const adaptado = adaptarInDesign({ jsonCrudo });
        const resultadoCompilacion = compilarLexmotor(adaptado.ast);

        let totalContenedores = 0;
        let coincidenciaExacta = 0;
        let padreContieneHijos = 0;
        let hijosContienenPadre = 0;
        let divergenciaReal = 0;

        let caracteresPadreTotal = 0;
        let caracteresHijosTotal = 0;

        // Función de normalización segura (elimina espacios múltiples y saltos de línea internos sin perder contenido)
        const normalizar = (str) => {
            if (!str || typeof str !== 'string') return '';
            return str.replace(/\s+/g, ' ').trim();
        };

        const muestrasDivergentes = [];

        const auditarCobertura = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;

            const esEditorial = typeof nodo.inDesignStyle === 'string' && nodo.inDesignStyle.trim() !== '';
            const tieneHijos = Array.isArray(nodo.contenido) && nodo.contenido.length > 0;

            if (esEditorial && tieneHijos) {
                totalContenedores++;
                const textoPadreRaw = nodo.texto || '';
                caracteresPadreTotal += textoPadreRaw.length;

                // Concatenamos el texto plano de todos los hijos directos
                const textosHijos = nodo.contenido.map(h => h.texto || '').join('');
                caracteresHijosTotal += textosHijos.length;

                const padreNorm = normalizar(textoPadreRaw);
                const hijosNorm = normalizar(textosHijos);

                if (padreNorm === hijosNorm) {
                    coincidenciaExacta++;
                } else if (padreNorm.includes(hijosNorm) || hijosNorm.includes(padreNorm)) {
                    if (padreNorm.length >= hijosNorm.length) {
                        padreContieneHijos++;
                    } else {
                        hijosContienenPadre++;
                    }
                } else {
                    divergenciaReal++;
                    if (muestrasDivergentes.length < 5) {
                        muestrasDivergentes.push({
                            estilo: nodo.inDesignStyle,
                            padre: padreNorm.substring(0, 50),
                            hijosConcat: hijosNorm.substring(0, 50)
                        });
                    }
                }
            }

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(auditarCobertura);
            }
        };

        const raizAst = resultadoCompilacion.ast.contenido || resultadoCompilacion.ast;
        if (Array.isArray(raizAst)) {
            raizAst.forEach(auditarCobertura);
        } else {
            auditarCobertura(raizAst);
        }

        // 2. Informe Forense en Consola
        console.log('\n====================================================================');
        console.log('   E12.6-C.17.22 — INFORME DE COBERTURA TEXTUAL PADRE ↔ HIJOS');
        console.log('====================================================================');
        console.log(`   Contenedores analizados                  : ${totalContenedores}`);
        console.log(`   - Coincidencia exacta (Padre == Hijos)   : ${coincidenciaExacta}`);
        console.log(`   - Padre contiene estrictamente a hijos   : ${padreContieneHijos}`);
        console.log(`   - Hijos contienen estrictamente al padre : ${hijosContienenPadre}`);
        console.log(`   - Divergencia textual real               : ${divergenciaReal}`);
        console.log('--------------------------------------------------------------------');
        console.log(`   Caracteres totales en textos padres      : ${caracteresPadreTotal}`);
        console.log(`   Caracteres totales en concatenación hijos: ${caracteresHijosTotal}`);
        
        if (muestrasDivergentes.length > 0) {
            console.log('--------------------------------------------------------------------');
            console.log('   Muestra de casos con divergencia real:');
            muestrasDivergentes.forEach((m, idx) => {
                console.log(`     [${idx + 1}] Estilo: "${m.estilo}"`);
                console.log(`         Padre: "${m.padre}"`);
                console.log(`         Hijos: "${m.hijosConcat}"`);
            });
        }
        console.log('====================================================================\n');

        expect(totalContenedores).toBe(208);
    });

});