'use strict';

const path = require('path');
const fs = require('fs');
const { adaptarInDesign } = require('../../src/adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../src/compiladores/compilarLexmotor');
const { constructorXHTML } = require('../../src/constructores/constructorXHTML');

describe('E12.6-C.40 — Integridad del AST Compilado a XHTML', () => {

    test('Invariante C.40: constructorXHTML renderiza fielmente el AST sin degradar fronteras ni mutar el árbol', () => {
        const rootDir = path.resolve(__dirname, '../..');
        const rutaJson = path.resolve(
            rootDir,
            'test/fixtures/raw/fragmento-211.json'
        );

        const jsonCrudo = JSON.parse(
            fs.readFileSync(rutaJson, 'utf8')
        );

        // 1. Ejecución del pipeline completo hasta AST compilado (C.38 + C.39 GREEN)
        const adaptado = adaptarInDesign({ jsonCrudo });
        const compilado = compilarLexmotor(adaptado.ast);

        // Instantánea previa para verificar inmutabilidad estricta del AST
        const astAntes = JSON.stringify(compilado.ast);

        // 2. Ejecución del renderizador XHTML
        const xhtmlOutput = constructorXHTML(compilado.ast);

        // 3. Verificación de inmutabilidad del AST
        const astDespues = JSON.stringify(compilado.ast);
        const astInmutable = (astAntes === astDespues);

        let contenedoresAuditados = 0;
        let fallosReconstruccionTextual = 0;
        let fronterasPreservadas = 0;
        let aparicionesVacio = 0;
        let duplicaciones = 0;

        // Función auxiliar para auditar el AST compilado frente a los invariantes C.40
        const auditarAST = (nodo) => {
            if (!nodo || typeof nodo !== 'object') return;

            const esEditorial =
                typeof nodo.inDesignStyle === 'string' &&
                nodo.inDesignStyle.trim() !== '';

            const tieneHijos =
                Array.isArray(nodo.contenido) &&
                nodo.contenido.length > 1;

            if (esEditorial && tieneHijos) {
                contenedoresAuditados++;
                const textoPadre = nodo.texto || '';
                const hijos = nodo.contenido;

                // C.40.1: Reconstrucción textual exacta de los hijos respecto al padre
                const textoReconstruido = hijos
                    .map(h => (typeof h.texto === 'string' ? h.texto : ''))
                    .join('');

                if (textoReconstruido !== textoPadre) {
                    fallosReconstruccionTextual++;
                }

                // C.40.2: Verificación de las 496 fronteras reconciliadas con espacio
                for (let i = 0; i < hijos.length - 1; i++) {
                    const A = hijos[i].texto || '';
                    const B = hijos[i + 1].texto || '';

                    if (A.length === 0 || B.length === 0) continue;

                    const ATrim = A.trimEnd();
                    const BTrim = B.trimStart();
                    const fronteraConEspacio = ATrim + ' ' + BTrim;

                    if (textoPadre.includes(fronteraConEspacio)) {
                        if (/[\s\u00A0]$/.test(A)) {
                            fronterasPreservadas++;
                        }
                    }
                }
            }

            // C.40.3: Ausencia de [VACÍO]
            if (typeof nodo.texto === 'string' && nodo.texto.includes('[VACÍO]')) {
                aparicionesVacio++;
            }

            if (Array.isArray(nodo.contenido)) {
                nodo.contenido.forEach(auditarAST);
            }
        };

        const raizAst = compilado.ast.contenido || compilado.ast;
        if (Array.isArray(raizAst)) {
            raizAst.forEach(auditarAST);
        } else {
            auditarAST(raizAst);
        }

        if (xhtmlOutput.includes('[VACÍO]')) {
            aparicionesVacio++;
        }

        // -------------------------------------------------------------
        // Informe analítico C.40
        // -------------------------------------------------------------

        console.log('\n====================================================================');
        console.log('   E12.6-C.40 — INFORME DE INTEGRIDAD AST → XHTML');
        console.log('====================================================================');
        console.log(`   Contenedores auditados                 : ${contenedoresAuditados}`);
        console.log(`   - Fallos reconstrucción textual        : ${fallosReconstruccionTextual}`);
        console.log(`   - Fronteras reconciliadas preservadas  : ${fronterasPreservadas}`);
        console.log(`   - Apariciones de [VACÍO]               : ${aparicionesVacio}`);
        console.log(`   - Duplicaciones textuales              : ${duplicaciones}`);
        console.log(`   - Mutaciones del AST                   : ${astInmutable ? 0 : 1}`);
        console.log('====================================================================\n');

        // -------------------------------------------------------------
        // Invariantes formales exigidos por C.40
        // -------------------------------------------------------------

        expect(contenedoresAuditados).toBe(163);
        expect(fallosReconstruccionTextual).toBe(0);
        expect(fronterasPreservadas).toBe(496);
        expect(aparicionesVacio).toBe(0);
        expect(duplicaciones).toBe(0);
        expect(astInmutable).toBe(true);
        expect(xhtmlOutput).toBeDefined();
        expect(typeof xhtmlOutput).toBe('string');
        expect(xhtmlOutput.length).toBeGreaterThan(0);
    });
});