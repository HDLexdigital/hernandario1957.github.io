'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');

describe('E12.6-C.30 — Auditoría Forense de Fronteras de Fragmentos', () => {

    test('Analiza los caracteres limítrofes entre hijos consecutivos para detectar reglas de frontera de espacio', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        const adaptado = adaptarInDesign({ jsonCrudo });
        const resultadoCompilacion = compilarLexmotor(adaptado.ast);

        let totalContenedoresConMultiplesHijos = 0;
        let fronterasAnalizadas = 0;
        let posiblesEspaciosFaltantes = 0;

        const muestrasFronteras = [];

        const auditarFronterasHijos = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;

            const esEditorial = typeof nodo.inDesignStyle === 'string' && nodo.inDesignStyle.trim() !== '';
            const tieneHijos = Array.isArray(nodo.contenido) && nodo.contenido.length > 1;

            if (esEditorial && tieneHijos) {
                totalContenedoresConMultiplesHijos++;
                const hijos = nodo.contenido;

                for (let i = 0; i < hijos.length - 1; i++) {
                    fronterasAnalizadas++;
                    const actualText = (hijos[i].texto || '');
                    const siguienteText = (hijos[i + 1].texto || '');

                    if (actualText.length === 0 || siguienteText.length === 0) continue;

                    const charFin = actualText[actualText.length - 1];
                    const charInicio = siguienteText[0];

                    // Si el hijo actual termina en carácter alfanumérico y el siguiente empieza en alfanumérico,
                    // y ninguno tiene espacio en el borde, es probable que falte un espacio de frontera.
                    const esAlfanumerico = (ch) => /[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9]/.test(ch);

                    if (esAlfanumerico(charFin) && esAlfanumerico(charInicio)) {
                        posiblesEspaciosFaltantes++;
                        if (muestrasFronteras.length < 5) {
                            muestrasFronteras.push({
                                estilo: nodo.inDesignStyle,
                                fragmentoA: actualText.substring(Math.max(0, actualText.length - 10)),
                                fragmentoB: siguienteText.substring(0, 10),
                                fin: charFin,
                                inicio: charInicio
                            });
                        }
                    }
                }
            }

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(auditarFronterasHijos);
            }
        };

        const raizAst = resultadoCompilacion.ast.contenido || resultadoCompilacion.ast;
        if (Array.isArray(raizAst)) {
            raizAst.forEach(auditarFronterasHijos);
        } else {
            auditarFronterasHijos(raizAst);
        }

        console.log('\n====================================================================');
        console.log('   E12.6-C.30 — INFORME DE AUDITORÍA DE FRONTERAS DE FRAGMENTOS');
        console.log('====================================================================');
        console.log(`   Contenedores con múltiples hijos : ${totalContenedoresConMultiplesHijos}`);
        console.log(`   Fronteras entre hijos analizadas : ${fronterasAnalizadas}`);
        console.log(`   Fronteras con posible falta de espacio: ${posiblesEspaciosFaltantes}`);
        console.log('--------------------------------------------------------------------');
        
        if (muestrasFronteras.length > 0) {
            console.log('   Muestra de uniones alfanuméricas limítrofes:');
            muestrasFronteras.forEach((m, idx) => {
                console.log(`     [${idx + 1}] Estilo: "${m.estilo}"`);
                console.log(`         Fin A : "...${m.fragmentoA}" [Char: '${m.fin}']`);
                console.log(`         Ini B : "${m.fragmentoB}..." [Char: '${m.inicio}']`);
            });
        }
        console.log('====================================================================\n');

        expect(totalContenedoresConMultiplesHijos).toBeGreaterThan(0);
    });

});