'use strict';

const path = require('path');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const { compilarLexmotor } = require('../../../src/compiladores/compilarLexmotor');
const { adaptarInDesign } = require('../../../src/adaptadores/InDesignAdapter');

describe('E12.6-C.1 — Diagnóstico Puro de Población Canónica', () => {

    test('Radiografía DOM: Frecuencia de Etiquetas y Clases', async () => {
        const rootDir = path.resolve(__dirname, '../../..');
        const rutaJsonFixture = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');
        const rutaSemanticMap = path.resolve(rootDir, 'estilos/fragmento.semantic_map.json');

        const contenidoRaw = JSON.parse(fs.readFileSync(rutaJsonFixture, 'utf8'));

        // 1. Adaptación pura (sin mutaciones manuales)
        const adaptado = adaptarInDesign({ jsonCrudo: contenidoRaw });

        // 2. Compilación pura a través del orquestador productivo
        const resultado = await compilarLexmotor(adaptado, { 
            semanticMapPath: rutaSemanticMap 
        });

        const dom = new JSDOM(resultado.xhtml);

        // 3. Seleccionamos ABSOLUTAMENTE TODO dentro del body
        const todosLosElementos = dom.window.document.querySelectorAll('body *');

        const inventario = {};
        let totalNodos = 0;

        todosLosElementos.forEach(el => {
            const tag = el.tagName.toLowerCase();
            const clases = el.getAttribute('class') || '[sin-clase]';
            
            // Creamos una firma única, ej: "p.texto_cuerpo.cuerpo-siguiente"
            const firma = `${tag}.${clases.trim().replace(/\s+/g, '.')}`;

            inventario[firma] = (inventario[firma] || 0) + 1;
            totalNodos++;
        });

        // 4. Ordenamos por frecuencia de mayor a menor
        const ordenado = Object.entries(inventario).sort((a, b) => b[1] - a[1]);

        console.log('\n====================================================================');
        console.log('   E12.6-C.1 — RADIOGRAFÍA DEL XHTML PRODUCTIVO (TAG + CLASSES)');
        console.log('====================================================================');

        ordenado.forEach(([firma, cantidad]) => {
            console.log(`   ↳ <${firma.padEnd(45, ' ')}> : ${cantidad.toString().padStart(4, ' ')} nodos`);
        });

        console.log('--------------------------------------------------------------------');
        console.log(`   TOTAL ELEMENTOS EN EL BODY: ${totalNodos}`);
        console.log('====================================================================\n');

        // Test dummy para que Jest no se queje
        expect(totalNodos).toBeGreaterThan(0);
    });

});