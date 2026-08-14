'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');
const { constructorXHTML } = require('../../src/constructores/constructorXHTML');

describe('E12.6-C.42 — Renderizado y Serialización XHTML', () => {

    test('Invariante C.42: constructorXHTML serializa fielmente sin inyectar saltos de línea destructivos en nodos inline', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');
        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        // 1. Orquestación E10 -> E12 garantizada por C.38-C.41
        const astE10 = adaptarInDesign({ jsonCrudo }).ast;
        const astCompilado = compilarLexmotor(astE10).ast;

        // 2. Ejecutar C.42 (Renderer a auditar)
        const xhtmlSalida = constructorXHTML(astCompilado);

        // 3. Auditoría mediante expresiones regulares sobre el string puro
        const totalParagraphs = (xhtmlSalida.match(/<p\b/g) || []).length;
        const totalSpans = (xhtmlSalida.match(/<span\b/g) || []).length;

        // Verificar la asignación de clase
        const spansTerminoGlosario = (xhtmlSalida.match(/<span[^>]*class="terminoglosario"[^>]*>/g) || []).length;
        
        // EL BUG CRÍTICO: Spans con saltos de línea inyectados
        const fugasDeEspacioInline = (xhtmlSalida.match(/<\/span>\n/g) || []).length;

        console.log('\n====================================================================');
        console.log('   E12.6-C.42 — INFORME DE SERIALIZACIÓN XHTML (RENDERER)');
        console.log('====================================================================');
        console.log(`   Párrafos generados (<p>)             : ${totalParagraphs}`);
        console.log(`   Nodos inline generados (<span>)      : ${totalSpans}`);
        console.log(`   - Spans con clase 'terminoglosario'  : ${spansTerminoGlosario}`);
        console.log(`   - Fugas de bloque (newlines en span) : ${fugasDeEspacioInline}`);
        console.log('====================================================================\n');

        // Asertos de Fidelidad Estructural
// Asertos de Fidelidad Estructural (208 corresponde a la cardinalidad real ontológica)
        expect(totalParagraphs).toBe(208);
        expect(totalSpans).toBe(909);
        expect(spansTerminoGlosario).toBe(349);
        
        // Aserto Crítico: Un nodo inline (span) NUNCA debe emitir un salto de línea \n al final
        expect(fugasDeEspacioInline).toBe(0);
    });
});