'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');

describe('E12.6-C.17.12 — Auditoría Microscópica del Fallback de Tag en el Renderer', () => {

    test('Identifica cuántos y qué tipo de nodos del AST llegan sin resolvedTag al compilador / renderer', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

        const jsonCrudo = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

        // 1. Ingestión, Adaptación y Compilación
        const adaptado = adaptarInDesign({ jsonCrudo });
        const resultadoCompilacion = compilarLexmotor(adaptado.ast);

        // 2. Inspección profunda del AST compilado para aislar nodos sin resolvedTag o texto/contenido
        let totalNodos = 0;
        let nodosConResolvedTag = 0;
        let nodosSinResolvedTag = 0;
        
        const clasificacionSinTag = {
            conTexto: 0,
            conContenidoHijos: 0,
            totalmenteVacios: 0,
            tiposDetectados: {}
        };

        const auditarNodosAST = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;
            totalNodos++;

            if (nodo.resolvedTag) {
                nodosConResolvedTag++;
            } else {
                nodosSinResolvedTag++;
                
                const tipo = nodo.tipo || nodo.tipoNodo || 'desconocido';
                clasificacionSinTag.tiposDetectados[tipo] = (clasificacionSinTag.tiposDetectados[tipo] || 0) + 1;

                const tieneTexto = typeof nodo.texto === 'string' && nodo.texto.trim() !== '';
                const tieneHijos = Array.isArray(nodo.contenido) && nodo.contenido.length > 0;

                if (tieneTexto) clasificacionSinTag.conTexto++;
                if (tieneHijos) clasificacionSinTag.conContenidoHijos++;
                if (!tieneTexto && !tieneHijos) clasificacionSinTag.totalmenteVacios++;
            }

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(auditarNodosAST);
            }
        };

        const raizAst = resultadoCompilacion.ast.contenido || resultadoCompilacion.ast;
        if (Array.isArray(raizAst)) {
            raizAst.forEach(auditarNodosAST);
        } else {
            auditarNodosAST(raizAst);
        }

        console.log('\n====================================================================');
        console.log('   E12.6-C.17.12 — AUDITORÍA DEL FALLBACK DE TAG EN EL AST');
        console.log('====================================================================');
        console.log(`   Total nodos analizados en AST      : ${totalNodos}`);
        console.log(`   Nodos con resolvedTag explícito    : ${nodosConResolvedTag}`);
        console.log(`   Nodos SIN resolvedTag (Fallback)   : ${nodosSinResolvedTag}`);
        console.log('--------------------------------------------------------------------');
        console.log('   Desglose de nodos sin resolvedTag:');
        console.log(`     - Con texto interno              : ${clasificacionSinTag.conTexto}`);
        console.log(`     - Con contenido/hijos            : ${clasificacionSinTag.conContenidoHijos}`);
        console.log(`     - Totalmente vacíos (sin nada)   : ${clasificacionSinTag.totalmenteVacios}`);
        console.log('     - Tipos de nodo registrados      :', JSON.stringify(clasificacionSinTag.tiposDetectados));
        console.log('====================================================================\n');

        expect(totalNodos).toBeGreaterThan(0);
    });

});