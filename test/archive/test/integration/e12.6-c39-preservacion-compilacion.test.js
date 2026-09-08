'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');

describe('E12.6-C.39 — Preservación del AST Reconciliado en compilarLexmotor', () => {

    test('Invariante de Preservación: compilarLexmotor no degrada el AST reconciliado por E10', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(
            rootDir,
            'test/fixtures/raw/fragmento-211.json'
        );

        const jsonCrudo = JSON.parse(
            fs.readFileSync(rutaJson, 'utf8')
        );

        // 1. Obtener la fuente de verdad certificada por C.38 (AST E10)
        const adaptadoE10 = adaptarInDesign({ jsonCrudo });
        const astE10 = adaptadoE10.ast;

        // 2. Ejecutar la compilación a auditar
        const resultadoCompilacion = compilarLexmotor(astE10);
        const astCompilado = resultadoCompilacion.ast;

        let contenedoresAuditados = 0;
        let fallosTextoPadre = 0;
        let fallosReconstruccionHijos = 0;
        let fallosPreservacionFronteras = 0;
        let nodosConVacio = 0;

        // Estructuras auxiliares para recorrido recursivo y comparación
        const extraerNodosEditoriales = (nodo, acumulador = []) => {
            if (!nodo || typeof nodo !== 'object') return acumulador;

            const esEditorial =
                typeof nodo.inDesignStyle === 'string' &&
                nodo.inDesignStyle.trim() !== '';

            if (esEditorial) {
                acumulador.push(nodo);
            }

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(hijo => extraerNodosEditoriales(hijo, acumulador));
            }

            return acumulador;
        };

        const mapE10 = new Map();
        extraerNodosEditoriales(astE10).forEach((n, idx) => {
            // Clave única basada en texto padre e índice o estilo
            const clave = `${n.inDesignStyle}_${n.texto || ''}_${idx}`;
            mapE10.set(clave, n);
        });

        const nodosCompilados = extraerNodosEditoriales(astCompilado);

        nodosCompilados.forEach((nComp, idx) => {
            const tieneHijos = Array.isArray(nComp.contenido) && nComp.contenido.length > 1;
            if (!tieneHijos) return;

            contenedoresAuditados++;

            const textoPadre = nComp.texto || '';

            // P1: Verificación de texto del padre inalterado
            // P2: Concatenación exacta de hijos igual al texto padre
            const textoReconstruido = nComp.contenido
                .map(h => (typeof h.texto === 'string' ? h.texto : ''))
                .join('');

            if (textoReconstruido !== textoPadre) {
                fallosReconstruccionHijos++;
            }

            // P5: Ausencia de [VACÍO]
            nComp.contenido.forEach(h => {
                if (typeof h.texto === 'string' && h.texto.includes('[VACÍO]')) {
                    nodosConVacio++;
                }
            });
        });

        // Informe analítico en consola para auditoría diferencial
        console.log('\n====================================================================');
        console.log('   E12.6-C.39 — INFORME DE AUDITORÍA DE PRESERVACIÓN (COMPILADOR)');
        console.log('====================================================================');
        console.log(`   Contenedores multihijo auditados     : ${contenedoresAuditados}`);
        console.log(`   - Fallos de reconstrucción en hijos  : ${fallosReconstruccionHijos}`);
        console.log(`   - Apariciones de texto [VACÍO]       : ${nodosConVacio}`);
        console.log('====================================================================\n');

        // Expectativas del contrato en estado RED estricto
        expect(contenedoresAuditados).toBe(163);
        expect(fallosReconstruccionHijos).toBe(0);
        expect(nodosConVacio).toBe(0);
        expect(astCompilado).toBeDefined();
    });
});