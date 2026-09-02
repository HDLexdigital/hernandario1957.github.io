'use strict';

const path = require('path');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const { adaptarInDesign } = require('../../../src/adaptadores/InDesignAdapter');
const { constructorXHTML } = require('../../../src/constructores/constructorXHTML');

describe('E12.6-C.8 — Auditoría de Atributos y Clases en el XHTML (Observacional)', () => {
    
    test('Inspección de firmas de clases y atributos en los elementos <p> del XHTML', () => {
        const rootDir = path.resolve(__dirname, '../../..');
        const rutaJsonFixture = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const contenidoRaw = JSON.parse(fs.readFileSync(rutaJsonFixture, 'utf8'));

        // 1. Adaptación pura
        const adaptado = adaptarInDesign({ jsonCrudo: contenidoRaw });

        let listaNodos = [];
        if (adaptado && adaptado.ast && Array.isArray(adaptado.ast.contenido)) {
            listaNodos = adaptado.ast.contenido;
        } else {
            throw new Error("Fallo forense: No se encontró adaptado.ast.contenido");
        }

        // 2. Compilación limpia al XHTML actual
        const xhtmlGenerado = constructorXHTML(listaNodos);
        const dom = new JSDOM(xhtmlGenerado);

        // 3. Auditoría exhaustiva de los elementos <p>
        const parrafos = Array.from(dom.window.document.querySelectorAll('p'));
        
        let conClase = 0;
        let sinClase = 0;
        let conAtributosCustom = 0;
        const inventarioClases = {};
        const inventarioAtributos = {};

        parrafos.forEach(el => {
            const classAttr = el.getAttribute('class');
            if (classAttr && classAttr.trim().length > 0) {
                conClase++;
                classAttr.split(' ').forEach(c => {
                    if (c) inventarioClases[c] = (inventarioClases[c] || 0) + 1;
                });
            } else {
                sinClase++;
            }

            // Revisar si existen otros atributos (data-*, id, style, etc.)
            Array.from(el.attributes).forEach(attr => {
                if (attr.name !== 'class') {
                    conAtributosCustom++;
                    inventarioAtributos[attr.name] = (inventarioAtributos[attr.name] || 0) + 1;
                }
            });
        });

        console.log('\n====================================================================');
        console.log('   E12.6-C.8 — AUDITORÍA DE ATRIBUTOS Y CLASES EN XHTML (<p>)');
        console.log('====================================================================');
        console.log(`   Total de elementos <p> en el DOM : ${parrafos.length}`);
        console.log(`   Elementos <p> con clases (class) : ${conClase}`);
        console.log(`   Elementos <p> sin clase (pelados): ${sinClase}`);
        console.log(`   Elementos con atributos custom   : ${conAtributosCustom}`);
        
        console.log('\n   Inventario de Clases CSS encontradas en el XHTML:');
        if (Object.keys(inventarioClases).length === 0) {
            console.log('     ↳ [NINGUNA CLASE ENCONTRADA EN EL XHTML]');
        } else {
            Object.entries(inventarioClases)
                .sort((a, b) => b[1] - a[1])
                .forEach(([clase, freq]) => {
                    console.log(`     ↳ class="${clase}" : ${freq} veces`);
                });
        }

        console.log('\n   Inventario de Atributos Adicionales:');
        if (Object.keys(inventarioAtributos).length === 0) {
            console.log('     ↳ [NINGÚN ATRIBUTO ADICIONAL ENCONTRADO]');
        } else {
            Object.entries(inventarioAtributos).forEach(([attr, freq]) => {
                console.log(`     ↳ ${attr} : ${freq} veces`);
            });
        }
        console.log('====================================================================\n');

        expect(parrafos.length).toBeGreaterThan(0);
    });

});