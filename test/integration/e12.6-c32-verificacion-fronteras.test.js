'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');

describe('E12.6-C.32 — Verificación Forense de Fronteras contra Texto Padre', () => {

    test('Contrasta cada frontera candidata (A + B) directamente contra el texto del contenedor padre', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        const adaptado = adaptarInDesign({ jsonCrudo });
        const resultadoCompilacion = compilarLexmotor(adaptado.ast);

        let totalFronterasValidadas = 0;
        let unionLegitimaSinEspacio = 0;
        let espacioNormalRequerido = 0;
        let nbspRequerido = 0;
        let noLocalizadasEnPadre = 0;

        const muestrasClasificadas = [];

        const verificarFronterasEnPadre = (nodo) => {
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

                    totalFronterasValidadas++;

                    const formaConcatenada = A + B;
                    const formaConEspacio = A + ' ' + B;
                    const formaConNbsp = A + '\u00A0' + B;

                    let clasificacion = '';

                    if (textoPadre.includes(formaConEspacio)) {
                        espacioNormalRequerido++;
                        clasificacion = 'ESPACIO NORMAL';
                    } else if (textoPadre.includes(formaConNbsp)) {
                        nbspRequerido++;
                        clasificacion = 'NBSP';
                    } else if (textoPadre.includes(formaConcatenada)) {
                        unionLegitimaSinEspacio++;
                        clasificacion = 'UNIÓN LEGÍTIMA';
                    } else {
                        noLocalizadasEnPadre++;
                        clasificacion = 'NO LOCALIZADA';
                    }

                    if (muestrasClasificadas.length < 8 && clasificacion === 'ESPACIO NORMAL') {
                        muestrasClasificadas.push({
                            estilo: nodo.inDesignStyle,
                            fragmentoA: A.substring(Math.max(0, A.length - 10)),
                            fragmentoB: B.substring(0, 10),
                            clasificacion
                        });
                    }
                }
            }

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(verificarFronterasEnPadre);
            }
        };

        const raizAst = resultadoCompilacion.ast.contenido || resultadoCompilacion.ast;
        if (Array.isArray(raizAst)) {
            raizAst.forEach(verificarFronterasEnPadre);
        } else {
            verificarFronterasEnPadre(raizAst);
        }

        console.log('\n====================================================================');
        console.log('   E12.6-C.32 — INFORME DE VERIFICACIÓN FORENSE DE FRONTERAS');
        console.log('====================================================================');
        console.log(`   Total fronteras entre hijos evaluadas : ${totalFronterasValidadas}`);
        console.log(`   - [A] Unión legítima (A + B sin espacio): ${unionLegitimaSinEspacio}`);
        console.log(`   - [B] Espacio normal requerido (A + ' ' + B): ${espacioNormalRequerido}`);
        console.log(`   - [C] NBSP requerido (A + NBSP + B)   : ${nbspRequerido}`);
        console.log(`   - [D] No localizadas exactamente      : ${noLocalizadasEnPadre}`);
        console.log('--------------------------------------------------------------------');

        if (muestrasClasificadas.length > 0) {
            console.log('   Muestra de fronteras que requieren espacio normal:');
            muestrasClasificadas.forEach((m, idx) => {
                console.log(`     [${idx + 1}] Estilo: "${m.estilo}" | A: "...${m.fragmentoA}" + B: "${m.fragmentoB}..." → Falta espacio`);
            });
        }
        console.log('====================================================================\n');

        expect(totalFronterasValidadas).toBeGreaterThan(0);
    });

});