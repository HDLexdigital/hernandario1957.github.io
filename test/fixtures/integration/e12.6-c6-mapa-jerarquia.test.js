'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../../src/adaptadores/InDesignAdapter');

describe('E12.6-C.6 — Relación Forense Padre/Hijo del AST', () => {

    test('Identificación objetiva de población raíz e interna', () => {

        const rootDir = path.resolve(__dirname, '../../..');
        const rutaJsonFixture = path.resolve(
            rootDir,
            'test/fixtures/raw/fragmento-211.json'
        );

        const contenidoRaw = JSON.parse(
            fs.readFileSync(rutaJsonFixture, 'utf8')
        );

        const adaptado = adaptarInDesign({
            jsonCrudo: contenidoRaw
        });

        if (
            !adaptado ||
            !adaptado.ast ||
            !Array.isArray(adaptado.ast.contenido)
        ) {
            throw new Error(
                'Fallo forense: no existe adaptado.ast.contenido[]'
            );
        }

        const raices = adaptado.ast.contenido;

        // ------------------------------------------------------------
        // Registro de identidad de objetos
        // ------------------------------------------------------------

        const todosLosNodos = [];
        const padresDeNodo = new Map();

        const explorar = (nodo, padre = null, ruta = 'root') => {

            if (!nodo || typeof nodo !== 'object') return;

            todosLosNodos.push({
                nodo,
                padre,
                ruta
            });

            if (padre) {
                padresDeNodo.set(nodo, padre);
            }

            const propiedades = [
                'contenido',
                'hijos',
                'children',
                'ast',
                'blocks',
                'parrafos'
            ];

            for (const propiedad of propiedades) {

                if (!Array.isArray(nodo[propiedad])) continue;

                nodo[propiedad].forEach((hijo, indice) => {
                    explorar(
                        hijo,
                        nodo,
                        `${ruta}.${propiedad}[${indice}]`
                    );
                });
            }
        };

        raices.forEach((nodo, indice) => {
            explorar(nodo, null, `raiz[${indice}]`);
        });

        // ------------------------------------------------------------
        // Clasificación por identidad, NO por tipoNodo ni estilo
        // ------------------------------------------------------------

        const conjuntoRaices = new Set(raices);

        const internos = todosLosNodos.filter(
            registro => !conjuntoRaices.has(registro.nodo)
        );

        const raicesConContenido = raices.filter(
            nodo => Array.isArray(nodo.contenido)
        );

        const internosReferenciados = internos.filter(
            registro => registro.padre !== null
        );

        // ------------------------------------------------------------
        // Estadísticas
        // ------------------------------------------------------------

        const resumen = {
            poblacionRaiz: raices.length,
            poblacionTotalRecorrida: todosLosNodos.length,
            poblacionInterna: internos.length,
            raicesConContenidoArray: raicesConContenido.length,
            internosConPadre: internosReferenciados.length
        };

        console.log('\n====================================================================');
        console.log('   E12.6-C.6 — RELACIÓN FORENSE PADRE / HIJO DEL AST');
        console.log('====================================================================');
        console.log('');
        console.log('   Población raíz              :', resumen.poblacionRaiz);
        console.log('   Población total recorrida   :', resumen.poblacionTotalRecorrida);
        console.log('   Población interna           :', resumen.poblacionInterna);
        console.log('   Raíces con contenido[]      :', resumen.raicesConContenidoArray);
        console.log('   Internos con padre          :', resumen.internosConPadre);
        console.log('');

        // ------------------------------------------------------------
        // Muestras de relación
        // ------------------------------------------------------------

        console.log('--------------------------------------------------------------------');
        console.log('   MUESTRAS DE RELACIÓN PADRE → HIJO');
        console.log('--------------------------------------------------------------------');

        raices
            .filter(nodo => Array.isArray(nodo.contenido))
            .slice(0, 5)
            .forEach((padre, indice) => {

                console.log('');
                console.log(
                    `   [Raíz ${indice + 1}]`,
                    `estilo=${padre.estiloParrafo || padre.inDesignStyle || '[ninguno]'}`,
                    `hijos=${padre.contenido.length}`
                );

                padre.contenido.forEach((hijo, indiceHijo) => {

                    if (!hijo || typeof hijo !== 'object') {
                        console.log(
                            `      └── hijo[${indiceHijo}]: ${typeof hijo}`
                        );
                        return;
                    }

                    console.log(
                        `      └── hijo[${indiceHijo}]`,
                        `tipo=${hijo.tipo || '[ninguno]'}`,
                        `tipoNodo=${hijo.tipoNodo || '[ninguno]'}`,
                        `estilo=${hijo.estiloCaracter || '[ninguno]'}`,
                        `texto=${JSON.stringify(
                            typeof hijo.texto === 'string'
                                ? hijo.texto.slice(0, 80)
                                : ''
                        )}`
                    );
                });
            });

        console.log('');
        console.log('====================================================================\n');

        // ------------------------------------------------------------
        // Aserciones exclusivamente estructurales
        // ------------------------------------------------------------

        expect(raices.length).toBe(208);

        expect(raicesConContenido.length).toBe(208);

        expect(todosLosNodos.length).toBeGreaterThanOrEqual(
            raices.length
        );

        expect(internosReferenciados.length).toBe(
            internos.length
        );
    });
});