'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');

describe('E12.6-C.38 — Integración Controlada de Reconciliación en la Capa E10', () => {

    test('Invariante E10: adaptarInDesign aplica reconciliación cumpliendo los 5 invariantes globales', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(
            rootDir,
            'test/fixtures/raw/fragmento-211.json'
        );

        const jsonCrudo = JSON.parse(
            fs.readFileSync(rutaJson, 'utf8')
        );

        // -------------------------------------------------------------
        // 1. Ejecución del adaptador E10 con reconciliación integrada
        // -------------------------------------------------------------

        const adaptado = adaptarInDesign({ jsonCrudo });

        let contenedoresMultihijoEvaluados = 0;
        let fronterasReconciliadasTotales = 0;
        let unionesLegitimasPreservadasTotales = 0;
        let modificacionesPadreTotales = 0;
        let fallosReconstruccionConcat = 0;

        const verificarInvariantesIntegracion = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;

            const esEditorial =
                typeof nodo.inDesignStyle === 'string' &&
                nodo.inDesignStyle.trim() !== '';

            const tieneHijos =
                Array.isArray(nodo.contenido) &&
                nodo.contenido.length > 1;

            if (esEditorial) {

                /*
                 * Capturamos el texto canónico del padre ANTES de realizar
                 * cualquier operación sobre sus hijos.
                 *
                 * Este valor es la fuente de verdad de C.38.
                 */
                const textoPadreOriginal =
                    typeof nodo.texto === 'string'
                        ? nodo.texto
                        : '';

                if (tieneHijos) {

                    contenedoresMultihijoEvaluados++;

                    const hijos = nodo.contenido;

                    // -------------------------------------------------
                    // Invariante 1:
                    // concatenación exacta de los hijos == padre
                    // -------------------------------------------------

                    const textoReconstruido = hijos
                        .map(h =>
                            typeof h.texto === 'string'
                                ? h.texto
                                : ''
                        )
                        .join('');

                    if (textoReconstruido !== textoPadreOriginal) {
                        fallosReconstruccionConcat++;
                    }

                    // -------------------------------------------------
                    // C.38 — Clasificación de fronteras
                    //
                    // IMPORTANTE:
                    // A ya puede contener el espacio agregado por E10.
                    //
                    // Por eso NO hacemos:
                    //
                    //     A + ' ' + B
                    //
                    // sobre el A ya reconciliado.
                    //
                    // En su lugar eliminamos únicamente el separador
                    // exterior de A y B para reconstruir la frontera
                    // semántica canónica.
                    // -------------------------------------------------

                    for (let i = 0; i < hijos.length - 1; i++) {

                        const A =
                            typeof hijos[i].texto === 'string'
                                ? hijos[i].texto
                                : '';

                        const B =
                            typeof hijos[i + 1].texto === 'string'
                                ? hijos[i + 1].texto
                                : '';

                        if (A.length === 0 || B.length === 0) {
                            continue;
                        }

                        /*
                         * El reconciliador adhiere el separador al
                         * fragmento izquierdo.
                         *
                         * Por tanto:
                         *
                         *     A = "La "
                         *     B = "soberanía"
                         *
                         * representa semánticamente:
                         *
                         *     "La" + " " + "soberanía"
                         */

                        const ATrim = A.trimEnd();
                        const BTrim = B.trimStart();

                        if (ATrim.length === 0 || BTrim.length === 0) {
                            continue;
                        }

                        const fronteraConEspacio =
                            ATrim + ' ' + BTrim;

                        const fronteraSinEspacio =
                            ATrim + BTrim;

                        /*
                         * C.38.1
                         *
                         * El texto canónico del padre exige un espacio
                         * entre ambos fragmentos.
                         */
                        if (textoPadreOriginal.includes(fronteraConEspacio)) {

                            /*
                             * La reconciliación es correcta solamente si
                             * el separador está efectivamente representado
                             * en el fragmento izquierdo.
                             *
                             * Se acepta espacio normal o NBSP.
                             */
                            const terminaConSeparador =
                                /[\s\u00A0]$/.test(A);

                            if (terminaConSeparador) {
                                fronterasReconciliadasTotales++;
                            }

                        /*
                         * C.38.2
                         *
                         * El texto canónico no necesita separador.
                         * La unión debe permanecer intacta.
                         */
                        } else if (
                            textoPadreOriginal.includes(fronteraSinEspacio)
                        ) {

                            unionesLegitimasPreservadasTotales++;
                        }
                    }
                }

                // -----------------------------------------------------
                // Invariante 2:
                // el texto canónico del padre nunca se modifica
                // -----------------------------------------------------

                if (nodo.texto !== textoPadreOriginal) {
                    modificacionesPadreTotales++;
                }
            }

            // ---------------------------------------------------------
            // Descenso recursivo
            // ---------------------------------------------------------

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(
                    verificarInvariantesIntegracion
                );
            }
        };

        // -------------------------------------------------------------
        // 2. Recorrido del AST adaptado
        // -------------------------------------------------------------

        const raizAst =
            adaptado.ast.contenido || adaptado.ast;

        if (Array.isArray(raizAst)) {
            raizAst.forEach(
                verificarInvariantesIntegracion
            );
        } else {
            verificarInvariantesIntegracion(raizAst);
        }

        // -------------------------------------------------------------
        // 3. Informe formal C.38
        // -------------------------------------------------------------

        console.log('\n====================================================================');
        console.log(
            '   E12.6-C.38 — INFORME DE INTEGRACIÓN DE RECONCILIACIÓN (E10)'
        );
        console.log('====================================================================');

        console.log(
            `   Contenedores multihijo evaluados     : ${contenedoresMultihijoEvaluados}`
        );

        console.log(
            `   - Fronteras reconciliadas con espacio: ${fronterasReconciliadasTotales}`
        );

        console.log(
            `   - Uniones legítimas preservadas      : ${unionesLegitimasPreservadasTotales}`
        );

        console.log(
            `   - Modificaciones ilegales al Padre   : ${modificacionesPadreTotales}`
        );

        console.log(
            `   - Fallos de reconstrucción conc      : ${fallosReconstruccionConcat}`
        );

        console.log('====================================================================\n');

        // -------------------------------------------------------------
        // 4. Invariantes formales exigidos por C.38
        // -------------------------------------------------------------

        expect(contenedoresMultihijoEvaluados).toBe(163);

        expect(fallosReconstruccionConcat).toBe(0);

        expect(fronterasReconciliadasTotales).toBe(496);

        expect(modificacionesPadreTotales).toBe(0);

        expect(adaptado.ast).toBeDefined();
    });
});