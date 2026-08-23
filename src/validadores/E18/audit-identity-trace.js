/**
 * E18.2.5.1 — Auditoría Forense de Capas A (AST) y B (XHTML)
 * Extrae muestras reales de canonicalId, identityKind, semanticType y atributos DOM.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { adaptarInDesign } = require('../../adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../compiladores/compilarLexmotor'); 
const ASTCanonicalizer = require('./ASTCanonicalizer');
const DOMCanonicalizer = require('./DOMCanonicalizer');

function auditTrace() {
    const rootDir = 'H:\\LexDigital\\Recursos\\AUTOMATIZAR INDESIGN\\proyecto-lexdigital_modular';
    const fixturePath = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

    console.log('\n====================================================');
    console.log(' AUDITORÍA FORENSE: TRAZABILIDAD DE IDENTIDAD (A & B)');
    console.log('====================================================\n');

    const rawJson = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    const adaptResult = adaptarInDesign({ jsonCrudo: rawJson });
    const ast = adaptResult.ast;

    const resultadoCompilacion = compilarLexmotor(ast);
    const xhtmlString = resultadoCompilacion.xhtml;

    // Proyección independiente
    const canonicalAst = ASTCanonicalizer.canonicalize(ast);
    const canonicalDom = DOMCanonicalizer.canonicalize(xhtmlString);

    console.log('--- CAPA A: MUESTRA DE NODOS AST (Primeros 5 con identidad explícita/sintética) ---');
    const astSample = canonicalAst.nodes.filter(n => n.nodeKind === 'semantic' || n.nodeKind === 'structural').slice(0, 5);
    astSample.forEach((n, i) => {
        console.log(`[AST #${i + 1}]`);
        console.log(`  canonicalId:        ${n.canonicalId}`);
        console.log(`  identityKind:       ${n.identityKind}`);
        console.log(`  semanticType:       ${n.semanticType}`);
        console.log(`  styleKey:           ${n.styleKey}`);
        console.log(`  parentCanonicalId:  ${n.parentCanonicalId}`);
        console.log(`  contentFingerprint: ${n.contentFingerprint}`);
    });

    console.log('\n--- CAPA B: MUESTRA DE NODOS DOM (Primeros 5 extraídos del XHTML) ---');
    const domSample = canonicalDom.nodes.slice(0, 5);
    domSample.forEach((n, i) => {
        console.log(`[DOM #${i + 1}]`);
        console.log(`  canonicalId:        ${n.canonicalId}`);
        console.log(`  identityKind:       ${n.identityKind}`);
        console.log(`  semanticType:       ${n.semanticType}`);
        console.log(`  styleKey:           ${n.styleKey}`);
        console.log(`  evidence (rawToken): ${n.evidence.rawToken}`);
    });

    console.log('\n--- INSPECCIÓN DE ATRIBUTOS HTML REALES (Fragmento XHTML) ---');
    // Mostrar una pequeña porción del XHTML real para ver si incluye id="" o data-*
    const snippetMatch = xhtmlString.match(/<[a-z0-9\-]+[^>]*>/gi);
    if (snippetMatch) {
        console.log('Primeras 5 etiquetas encontradas en el XHTML generado:');
        snippetMatch.slice(0, 5).forEach((tag, i) => {
            console.log(`  Tag [${i + 1}]: ${tag}`);
        });
    } else {
        console.log('No se pudieron aislar etiquetas mediante regex básica en el XHTML.');
    }

    console.log('\n====================================================\n');
}

auditTrace();