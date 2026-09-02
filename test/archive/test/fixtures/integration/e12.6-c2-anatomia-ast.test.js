'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../../src/adaptadores/InDesignAdapter');

describe('E12.6-C.2 — Anatomía Estructural del AST Adaptado', () => {
    
    test('Radiografía de Tipos, Estilos y Clases en listaNodos (Pre-Orquestador)', () => {
        const rootDir = path.resolve(__dirname, '../../..');
        const rutaJsonFixture = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const contenidoRaw = JSON.parse(fs.readFileSync(rutaJsonFixture, 'utf8'));

        // 1. Adaptación pura (caja negra)
        const adaptado = adaptarInDesign({ jsonCrudo: contenidoRaw });

        // 2. Extracción de la población en la ruta reina comprobada
        let listaNodos = [];
        if (adaptado && adaptado.ast && Array.isArray(adaptado.ast.contenido)) {
            listaNodos = adaptado.ast.contenido;
        } else {
            throw new Error("Fallo forense: No se encontró adaptado.ast.contenido");
        }

        // 3. Recorrido recursivo puro (Lectura sin mutación)
        const inventario = {};
        let totalNodos = 0;

        const explorarNodo = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;

            // Extracción de metadatos estructurales
            const tipo = nodo.tipo || nodo.tipoNodo || '[sin-tipo]';
            const estilo = nodo.inDesignStyle || nodo.estiloParrafo || nodo.estiloCaracter || '[sin-estilo]';
            const claseLegal = nodo.claseLegal || '[sin-clase-legal]';

            // Firma de identificación
            const firma = `${tipo} | ${estilo} | ${claseLegal}`;
            
            inventario[firma] = (inventario[firma] || 0) + 1;
            totalNodos++;

            // Propagación en profundidad
            ['contenido', 'hijos', 'children', 'ast', 'blocks', 'parrafos'].forEach(prop => {
                if (nodo[prop] && Array.isArray(nodo[prop])) {
                    nodo[prop].forEach(explorarNodo);
                }
            });
        };

        listaNodos.forEach(explorarNodo);

        // 4. Clasificación y Reporte
        const ordenado = Object.entries(inventario).sort((a, b) => b[1] - a[1]);

        console.log('\n====================================================================');
        console.log('   E12.6-C.2 — ANATOMÍA DEL AST (POST-ADAPTADOR, PRE-ORQUESTADOR)');
        console.log('   FORMATO: TIPO | ESTILO | CLASE LEGAL');
        console.log('====================================================================');

        ordenado.forEach(([firma, cantidad]) => {
            console.log(`   ↳ ${firma.padEnd(55, ' ')} : ${cantidad.toString().padStart(4, ' ')} nodos`);
        });

        console.log('--------------------------------------------------------------------');
        console.log(`   TOTAL NODOS EN EL ÁRBOL AST: ${totalNodos}`);
        console.log('====================================================================\n');

        // Aserción dummy para Jest
        expect(totalNodos).toBeGreaterThan(0);
    });

});