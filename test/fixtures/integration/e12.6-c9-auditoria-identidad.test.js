'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../../src/adaptadores/InDesignAdapter');
const { constructorXHTML } = require('../../../src/constructores/constructorXHTML');

describe('E12.6-C.9 — Auditoría de Identidad Estilística AST → XHTML (Observacional)', () => {
    
    test('Inventario exhaustivo de estilos originales en el AST vs Clases en XHTML', () => {
        const rootDir = path.resolve(__dirname, '../../..');
        const rutaJsonFixture = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const contenidoRaw = JSON.parse(fs.readFileSync(rutaJsonFixture, 'utf8'));

        // 1. Adaptación pura (Caja negra)
        const adaptado = adaptarInDesign({ jsonCrudo: contenidoRaw });

        let listaNodos = [];
        if (adaptado && adaptado.ast && Array.isArray(adaptado.ast.contenido)) {
            listaNodos = adaptado.ast.contenido;
        } else {
            throw new Error("Fallo forense: No se encontró adaptado.ast.contenido");
        }

        // 2. Inventario de estilos en el AST (Inspección profunda de propiedades propietarias)
        const inventarioEstilosAST = {};
        let totalNodosAST = 0;
        let nodosConEstiloAST = 0;

        const auditarAST = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;
            totalNodosAST++;

            // Buscamos todas las posibles variantes de nombres de estilo que InDesign y el adaptador manejan
            const estiloEncontrado = 
                nodo.inDesignStyle || 
                nodo.estiloParrafo || 
                nodo.estiloCaracter || 
                (nodo.propiedadesEstilo && nodo.propiedadesEstilo.nombre) || 
                null;

            if (estiloEncontrado) {
                nodosConEstiloAST++;
                inventarioEstilosAST[estiloEncontrado] = (inventarioEstilosAST[estiloEncontrado] || 0) + 1;
            } else {
                inventarioEstilosAST['[sin-estilo-detectado]'] = (inventarioEstilosAST['[sin-estilo-detectado]'] || 0) + 1;
            }

            // Recorrido recursivo seguro por todas las colecciones hijas posibles
            ['contenido', 'hijos', 'children', 'ast', 'blocks', 'parrafos'].forEach(prop => {
                const sub = nodo[prop];
                if (Array.isArray(sub)) {
                    sub.forEach(auditarAST);
                }
            });
        };

        listaNodos.forEach(auditarAST);

        // 3. Generación del XHTML actual para contrastar
        const xhtmlGenerado = constructorXHTML(listaNodos);
        
        // Conteo rápido de clases emitidas en el XHTML
        const regexClases = /class="([^"]+)"/g;
        const inventarioClasesXHTML = {};
        let match;
        let totalClasesEnXHTML = 0;

        while ((match = regexClases.exec(xhtmlGenerado)) !== null) {
            totalClasesEnXHTML++;
            const clases = match[1].split(' ');
            clases.forEach(c => {
                if (c) inventarioClasesXHTML[c] = (inventarioClasesXHTML[c] || 0) + 1;
            });
        }

        console.log('\n====================================================================');
        console.log('   E12.6-C.9 — AUDITORÍA DE IDENTIDAD ESTILÍSTICA (AST vs XHTML)');
        console.log('====================================================================');
        console.log(`   Total nodos recorridos en el AST     : ${totalNodosAST}`);
        console.log(`   Nodos con estilo detectado en AST    : ${nodosConEstiloAST}`);
        console.log('--------------------------------------------------------------------');
        console.log('   INVENTARIO DE ESTILOS EN EL AST (ORIGINALES DE INDESIGN):');
        Object.entries(inventarioEstilosAST)
            .sort((a, b) => b[1] - a[1])
            .forEach(([estilo, freq]) => {
                console.log(`     ↳ "${estilo}" : ${freq} veces`);
            });
        
        console.log('--------------------------------------------------------------------');
        console.log(`   Total apariciones de clases en XHTML : ${totalClasesEnXHTML}`);
        console.log('   INVENTARIO DE CLASES EN EL XHTML GENERADO:');
        Object.entries(inventarioClasesXHTML)
            .sort((a, b) => b[1] - a[1])
            .forEach(([clase, freq]) => {
                console.log(`     ↳ class="${clase}" : ${freq} veces`);
            });
        console.log('====================================================================\n');

        expect(totalNodosAST).toBeGreaterThan(0);
    });

});