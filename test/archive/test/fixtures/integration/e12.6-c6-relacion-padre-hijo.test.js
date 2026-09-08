'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../../src/adaptadores/InDesignAdapter');

describe('E12.6-C.6 — Relación Forense Padre-Hijo del AST', () => {

    test('Identificación objetiva de raíces y nodos internos', () => {
        const rootDir = path.resolve(__dirname, '../../..');
        const rutaJsonFixture = path.resolve(
            rootDir,
            'test/fixtures/raw/fragmento-211.json'
        );

        const contenidoRaw = JSON.parse(
            fs.readFileSync(rutaJsonFixture, 'utf8')
        );

        // ================================================================
        // 1. ADAPTACIÓN PURA
        // ================================================================

        const adaptado = adaptarInDesign({
            jsonCrudo: contenidoRaw
        });

        if (
            !adaptado ||
            !adaptado.ast ||
            !Array.isArray(adaptado.ast.contenido)
        ) {
            throw new Error(
                'Fallo forense: no se encontró adaptado.ast.contenido'
            );
        }

        const listaRaiz = adaptado.ast.contenido;

        // ================================================================
        // 2. REGISTRO DE IDENTIDAD DE OBJETOS
        // ================================================================
        //
        // Usamos referencias de objeto, NO estilos ni tipoNodo.
        // Esto permite determinar objetivamente si un nodo aparece
        // posteriormente como hijo de otro nodo.
        //
        // ================================================================

        const todosLosNodos = [];
        const padres = new Set();
        const hijos = new Set();

        const relaciones = [];

        const visitar = (nodo, padre = null, profundidad = 0, indice = null) => {
            if (!nodo || typeof nodo !== 'object') {
                return;
            }

            todosLosNodos.push(nodo);

            if (padre) {
                hijos.add(nodo);
                padres.add(padre);

                relaciones.push({
                    padre,
                    hijo: nodo,
                    profundidad,
                    indice
                });
            }

            const propiedadesContenedoras = [
                'contenido',
                'hijos',
                'children',
                'ast',
                'blocks',
                'parrafos'
            ];

            for (const propiedad of propiedadesContenedoras) {
                const valor = nodo[propiedad];

                if (!Array.isArray(valor)) {
                    continue;
                }

                valor.forEach((hijo, i) => {
                    visitar(hijo, nodo, profundidad + 1, i);
                });
            }
        };

        // ================================================================
        // 3. RECORRIDO DESDE LAS RAÍCES CANÓNICAS
        // ================================================================

        listaRaiz.forEach((nodo, indice) => {
            visitar(nodo, null, 0, indice);
        });

        // ================================================================
        // 4. IDENTIFICACIÓN DE POBLACIONES
        // ================================================================

        const conjuntoRaices = new Set(listaRaiz);

        const nodosInternos = todosLosNodos.filter(
            nodo => !conjuntoRaices.has(nodo)
        );

        const raicesConContenido = listaRaiz.filter(
            nodo => Array.isArray(nodo.contenido)
        );

        const nodosConPadre = hijos.size;

        // ================================================================
        // 5. INVENTARIO DE PROFUNDIDADES
        // ================================================================

        const profundidad = new Map();

        const registrarProfundidad = (nodo, nivel) => {
            if (!profundidad.has(nodo)) {
                profundidad.set(nodo, nivel);
            }
        };

        const recorrerProfundidad = (nodo, nivel = 0) => {
            if (!nodo || typeof nodo !== 'object') {
                return;
            }

            registrarProfundidad(nodo, nivel);

            const propiedades = [
                'contenido',
                'hijos',
                'children',
                'ast',
                'blocks',
                'parrafos'
            ];

            for (const propiedad of propiedades) {
                if (!Array.isArray(nodo[propiedad])) {
                    continue;
                }

                nodo[propiedad].forEach(hijo => {
                    recorrerProfundidad(hijo, nivel + 1);
                });
            }
        };

        listaRaiz.forEach(nodo => recorrerProfundidad(nodo));

        const matrizProfundidad = {};

        for (const nivel of profundidad.values()) {
            matrizProfundidad[nivel] =
                (matrizProfundidad[nivel] || 0) + 1;
        }

        // ================================================================
        // 6. FIRMAS DE RAÍCES
        // ================================================================

        const firmasRaiz = {};

        listaRaiz.forEach(nodo => {
            const tipo = nodo.tipo || '[sin-tipo]';
            const tipoNodo = nodo.tipoNodo || '[sin-tipoNodo]';
            const estilo =
                nodo.estiloParrafo ||
                nodo.inDesignStyle ||
                '[sin-estilo]';

            const firma = `${tipo} | ${tipoNodo} | ${estilo}`;

            firmasRaiz[firma] = (firmasRaiz[firma] || 0) + 1;
        });

        // ================================================================
        // 7. FIRMA DE NODOS INTERNOS
        // ================================================================

        const firmasInternas = {};

        nodosInternos.forEach(nodo => {
            const tipo = nodo.tipo || '[sin-tipo]';
            const tipoNodo = nodo.tipoNodo || '[sin-tipoNodo]';
            const estilo =
                nodo.estiloCaracter ||
                nodo.inDesignStyle ||
                '[sin-estilo]';

            const firma = `${tipo} | ${tipoNodo} | ${estilo}`;

            firmasInternas[firma] =
                (firmasInternas[firma] || 0) + 1;
        });

        // ================================================================
        // 8. DIAGNÓSTICO FORENSE
        // ================================================================

        console.log('\n====================================================================');
        console.log('   E12.6-C.6 — RELACIÓN FORENSE PADRE-HIJO DEL AST');
        console.log('====================================================================');

        console.log('\nPOBLACIONES:');
        console.log(
            `   ↳ Raíces canónicas:                 ${listaRaiz.length}`
        );
        console.log(
            `   ↳ Nodos totales recorridos:         ${todosLosNodos.length}`
        );
        console.log(
            `   ↳ Nodos internos:                    ${nodosInternos.length}`
        );
        console.log(
            `   ↳ Raíces con contenido[]:            ${raicesConContenido.length}`
        );
        console.log(
            `   ↳ Nodos referenciados como hijos:    ${nodosConPadre}`
        );

        console.log('\nPROFUNDIDAD DEL ÁRBOL:');

        Object.entries(matrizProfundidad)
            .sort(([a], [b]) => Number(a) - Number(b))
            .forEach(([nivel, cantidad]) => {
                console.log(
                    `   ↳ Profundidad ${nivel}: ${cantidad} nodos`
                );
            });

        console.log('\nFIRMAS DE LAS RAÍCES:');

        Object.entries(firmasRaiz)
            .sort((a, b) => b[1] - a[1])
            .forEach(([firma, cantidad]) => {
                console.log(
                    `   ↳ ${firma.padEnd(60, ' ')} : ${cantidad}`
                );
            });

        console.log('\nFIRMAS DE LOS NODOS INTERNOS:');

        Object.entries(firmasInternas)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .forEach(([firma, cantidad]) => {
                console.log(
                    `   ↳ ${firma.padEnd(60, ' ')} : ${cantidad}`
                );
            });

        console.log('\nRELACIONES PADRE → HIJO:');

        relaciones.slice(0, 10).forEach((relacion, indice) => {
            const padre = relacion.padre;
            const hijo = relacion.hijo;

            const estiloPadre =
                padre.estiloParrafo ||
                padre.inDesignStyle ||
                '[sin-estilo]';

            const estiloHijo =
                hijo.estiloCaracter ||
                hijo.inDesignStyle ||
                '[sin-estilo]';

            console.log(
                `   [${indice + 1}] ${estiloPadre} → ${estiloHijo}`
            );
        });

        console.log('\n====================================================================\n');

        // ================================================================
        // 9. INVARIANTES OBSERVACIONALES
        // ================================================================

        expect(listaRaiz.length).toBeGreaterThan(0);
        expect(todosLosNodos.length).toBeGreaterThan(0);

        // Esta prueba NO fija todavía 208 ni 1117 como contrato.
        // Primero queremos observar la relación real.
        expect(nodosInternos.length).toBeGreaterThanOrEqual(0);
    });

});