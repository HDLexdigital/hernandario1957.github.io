'use strict';

const fs = require('fs');
const path = require('path');
const { compilarLexmotor } = require('../../../src/index');
const { adaptarInDesign } = require('../../../src/adaptadores/InDesignAdapter');

describe('E12.5-BASE — Rastreo Forense del Origen de la Clase y Propagación Tipográfica', () => {

    test('E12.5-BASE — Inspección de metadatos desde el JSON bruto hasta el AST y el XHTML', async () => {
        const fixturePath = path.join(__dirname, '../raw/fragmento-211.json');
        const semanticMapPath = path.join(__dirname, '../raw/fragmento-211.semantic_map.json');
        const cssPath = path.join(__dirname, '../../../estilos/fragmento.css');

        const fixtureRaw = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
        const semanticMap = fs.existsSync(semanticMapPath) 
            ? JSON.parse(fs.readFileSync(semanticMapPath, 'utf8')) 
            : null;

        console.log('\n====================================================================');
        console.log('   E12.5-BASE — FORENSE DE TRAZABILIDAD (JSON → AST → XHTML)');
        console.log('====================================================================');

        // 1. Inspeccionar el JSON crudo de origen para ver qué estilos de InDesign trae
        const elementosRaw = fixtureRaw.elementos || fixtureRaw.paragraphs || fixtureRaw.items || [];
        console.log(`\n[1. ORIGEN — JSON CRUDO DE INDESIGN] (Total elementos: ${elementosRaw.length})`);
        elementosRaw.slice(0, 4).forEach((el, idx) => {
            console.log(`  Elemento ${idx + 1}: estilo="${el.estilo || el.paragraphStyle || el.styleName || 'N/A'}" | tipo="${el.tipo || el.type || 'N/A'}"`);
        });

        // 2. Ejecutar adaptación
        const adaptacion = adaptarInDesign({ jsonCrudo: fixtureRaw, semanticMap });
        console.log('\n[2. ADAPTACIÓN — AST CANÓNICO]');
        const nodosAST = Array.isArray(adaptacion.ast) ? adaptacion.ast : (adaptacion.ast.nodos || adaptacion.ast.elements || []);
        console.log(`  Total nodos en AST: ${nodosAST.length}`);
        nodosAST.slice(0, 4).forEach((nodo, idx) => {
            console.log(`  Nodo AST ${idx + 1}: tipo="${nodo.tipo}" | subclase="${nodo.subclase || nodo.claseCSS || 'N/A'}" | estiloOriginal="${nodo.estiloOriginal || nodo.style || 'N/A'}"`);
            // Imprimimos todas las propiedades del nodo para ver qué metadatos conserva
            console.log(`    Keys del nodo:`, Object.keys(nodo));
        });

        // 3. Compilar a XHTML
        const resultado = await compilarLexmotor(adaptacion.ast, 'fragmento-211', cssPath);
        console.log('\n[3. RENDERIZADO — ESTRUCTURA XHTML GENERADA]');
        
        // Extraemos etiquetas representativas del XHTML
        const regexTags = /<(p|h2|div)[^>]*class="([^"]*)"[^>]*>[\s\S]*?<\/\1>/g;
        let match;
        let contadorMuestra = 0;
        while ((match = regexTags.exec(resultado.xhtml)) !== null && contadorMuestra < 5) {
            contadorMuestra++;
            console.log(`  XHTML Muestra ${contadorMuestra}: tag=<${match[1]}> class="${match[2]}"`);
        }

        console.log('\n====================================================================');
        console.log('   E12.5-BASE FORENSE CONCLUIDO EXITOSAMENTE');
        console.log('====================================================================');

        expect(adaptacion.ast).toBeDefined();
        expect(resultado.xhtml).toBeDefined();
    });

});