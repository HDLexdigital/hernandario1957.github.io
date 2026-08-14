'use strict';

const fs = require('fs');
const path = require('path');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');

describe('E12.6-C.16 — Invariante Contractual de Ontología en el InDesignAdapter', () => {

    test('Los nodos con estilo de párrafo deben poseer consistentemente tipo="parrafo" y tipoNodo="paragraph"', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));
        const resultado = adaptarInDesign({ jsonCrudo });

        let nodosVioladores = 0;
        let totalInspeccionados = 0;

        const verificarInvariante = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;

            const estiloParrafo = nodo.estiloParrafo || nodo.inDesignStyle;

            if (estiloParrafo && estiloParrafo !== '[Ninguno]') {
                totalInspeccionados++;
                
                // Contrato ontológico estricto
                if (nodo.tipo !== 'parrafo' || nodo.tipoNodo !== 'paragraph') {
                    nodosVioladores++;
                    console.log(`[Violación Invariante] Estilo: ${estiloParrafo} | tipo: "${nodo.tipo}" | tipoNodo: "${nodo.tipoNodo}"`);
                }
            }

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(verificarInvariante);
            }
        };

        verificarInvariante(resultado.ast);

        console.log('\n====================================================================');
        console.log('   E12.6-C.16 — INFORME DE INVARIANTE ONTOLÓGICO');
        console.log('====================================================================');
        console.log(`   Total de nodos con estilo de párrafo evaluados : ${totalInspeccionados}`);
        console.log(`   Nodos con contradicción ontológica (Fugas)   : ${nodosVioladores}`);
        console.log('====================================================================\n');

        expect(totalInspeccionados).toBeGreaterThan(0);
        expect(nodosVioladores).toBe(0);
    });

});