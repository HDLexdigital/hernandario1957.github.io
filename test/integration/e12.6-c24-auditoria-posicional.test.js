'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');

describe('E12.6-C.24 — Auditoría Posicional de Divergencia Textual (Padre ↔ Hijos)', () => {

    test('Localiza la primera posición diferente y evalúa la cobertura de caracteres entre textoPadre y la concatenación de hijos', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        // 1. Ingestión, Adaptación y Compilación
        const adaptado = adaptarInDesign({ jsonCrudo });
        const resultadoCompilacion = compilarLexmotor(adaptado.ast);

        let totalContenedores = 0;
        let casosCoincidentes = 0;
        let casosDivergentes = 0;

        const muestrasAnalisis = [];

        const auditarPosicional = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;

            const esEditorial = typeof nodo.inDesignStyle === 'string' && nodo.inDesignStyle.trim() !== '';
            const tieneHijos = Array.isArray(nodo.contenido) && nodo.contenido.length > 0;

            if (esEditorial && tieneHijos) {
                totalContenedores++;
                const textoPadre = nodo.texto || '';
                const textosHijos = nodo.contenido.map(h => h.texto || '').join('');

                if (textoPadre === textosHijos) {
                    casosCoincidentes++;
                } else {
                    casosDivergentes++;
                    
                    // Encontrar la primera posición de divergencia exacta carácter a carácter
                    let primeraPos = -1;
                    const maxLen = Math.max(textoPadre.length, textosHijos.length);
                    for (let i = 0; i < maxLen; i++) {
                        if (textoPadre[i] !== textosHijos[i]) {
                            primeraPos = i;
                            break;
                        }
                    }

                    if (muestrasAnalisis.length < 8) {
                        const inicioContexto = Math.max(0, primeraPos - 10);
                        muestrasAnalisis.push({
                            estilo: nodo.inDesignStyle,
                            traceId: nodo.__traceId || 'sin-traza',
                            longitudPadre: textoPadre.length,
                            longitudHijos: textosHijos.length,
                            primeraPos,
                            contextoPadre: textoPadre.substring(inicioContexto, primeraPos + 15),
                            contextoHijos: textosHijos.substring(inicioContexto, primeraPos + 15)
                        });
                    }
                }
            }

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(auditarPosicional);
            }
        };

        const raizAst = resultadoCompilacion.ast.contenido || resultadoCompilacion.ast;
        if (Array.isArray(raizAst)) {
            raizAst.forEach(auditarPosicional);
        } else {
            auditarPosicional(raizAst);
        }

        // 2. Informe Forense en Consola
        console.log('\n====================================================================');
        console.log('   E12.6-C.24 — INFORME DE AUDITORÍA POSICIONAL DE DIVERGENCIA');
        console.log('====================================================================');
        console.log(`   Total contenedores analizados       : ${totalContenedores}`);
        console.log(`   Casos con identidad exacta (Padre=Hijos): ${casosCoincidentes}`);
        console.log(`   Casos con divergencia posicional    : ${casosDivergentes}`);
        console.log('--------------------------------------------------------------------');
        
        if (muestrasAnalisis.length > 0) {
            console.log('   Muestra detallada de puntos de divergencia posicional:');
            muestrasAnalisis.forEach((m, idx) => {
                console.log(`     [${idx + 1}] Estilo: "${m.estilo}" | Traza: ${m.traceId} | Posición diff: ${m.primeraPos}`);
                console.log(`         Padre [ctx]: "...${m.contextoPadre}..."`);
                console.log(`         Hijos [ctx]: "...${m.contextoHijos}..."`);
            });
        }
        console.log('====================================================================\n');

        expect(totalContenedores).toBe(208);
    });

});