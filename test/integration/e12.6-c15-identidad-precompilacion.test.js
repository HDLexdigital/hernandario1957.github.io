'use strict';

const fs = require('fs');
const path = require('path');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');

describe('E12.6-C.15 — Identidad ontológica antes de compilación', () => {

    test('Verifica la identidad de tipo inmediatamente después del InDesignAdapter', () => {

        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(
            rootDir,
            'test/fixtures/raw/fragmento-211.json'
        );

        const jsonCrudo = JSON.parse(
            fs.readFileSync(rutaJson, 'utf8')
        );

        const resultado = adaptarInDesign({
            jsonCrudo
        });

        const encontrados = {
            P01_BODY_BASE: [],
            P01_BODY_CONT: [],
            P07_INDENT_L1: [],
            P02_TITLE_MAIN: [],
            P02_TITLE_PART: [],
            P02_TITLE_CHAPTER: []
        };

        const recorrer = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;

            const estilo =
                nodo.inDesignStyle ||
                nodo.estiloParrafo ||
                nodo.estiloCaracter ||
                null;

            if (Object.prototype.hasOwnProperty.call(encontrados, estilo)) {
                encontrados[estilo].push({
                    tipo: nodo.tipo,
                    tipoNodo: nodo.tipoNodo,
                    inDesignStyle: nodo.inDesignStyle ?? null,
                    estiloParrafo: nodo.estiloParrafo ?? null,
                    estiloCaracter: nodo.estiloCaracter ?? null
                });
            }

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(recorrer);
            }
        };

        recorrer(resultado.ast);

        console.log('\n====================================================================');
        console.log('   E12.6-C.15 — IDENTIDAD ONTOLÓGICA PRE-COMPILACIÓN');
        console.log('====================================================================');

        Object.entries(encontrados).forEach(([estilo, nodos]) => {

            console.log(`\n   Estilo: [${estilo}]`);
            console.log(`   Total: ${nodos.length}`);

            const tipos = {};

            nodos.forEach(nodo => {
                tipos[nodo.tipo] = (tipos[nodo.tipo] || 0) + 1;
            });

            console.log('   Distribución de tipo:', tipos);

            nodos.slice(0, 5).forEach((nodo, i) => {
                console.log(
                    `      [${i + 1}] ` +
                    `tipo=${nodo.tipo} | ` +
                    `tipoNodo=${nodo.tipoNodo} | ` +
                    `inDesignStyle=${nodo.inDesignStyle} | ` +
                    `estiloParrafo=${nodo.estiloParrafo} | ` +
                    `estiloCaracter=${nodo.estiloCaracter}`
                );
            });
        });

        console.log('\n====================================================================\n');

        expect(resultado.ast).toBeDefined();
    });
});