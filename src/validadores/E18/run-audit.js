/**
 * E18.2.5 — Auditoría Empírica Extremo a Extremo
 * Orquestador observacional: AST(Real) ↔ XHTML(Generado en memoria)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { adaptarInDesign } = require('../../adaptadores/InDesignAdapter');
const { compilarLexmotor } = require('../../compiladores/compilarLexmotor'); 
const ASTCanonicalizer = require('./ASTCanonicalizer');
const DOMCanonicalizer = require('./DOMCanonicalizer');
const FID01IdentityAssertion = require('./FID01IdentityAssertion');

function runAudit() {
    const rootDir = 'H:\\LexDigital\\Recursos\\AUTOMATIZAR INDESIGN\\proyecto-lexdigital_modular';
    const fixturePath = path.resolve(rootDir, 'test/fixtures/raw/fragmento-211.json');

    console.log('\n====================================================');
    console.log(' E18.2.5 — EMPIRICAL FIDELITY AUDIT');
    console.log('====================================================\n');

    if (!fs.existsSync(fixturePath)) {
        console.error(`[ERROR] No se encuentra el fixture JSON en: ${fixturePath}`);
        return;
    }

    // 1. Obtener artefacto real de entrada
    const rawJson = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

    // 2. Ejecutar el pipeline de adaptación y compilación
    const adaptResult = adaptarInDesign({ jsonCrudo: rawJson });
    const ast = adaptResult.ast;

    // Compilar el XHTML al vuelo
    const resultadoCompilacion = compilarLexmotor(ast);

    // ---- INSPECCIÓN FORENSE ----
    console.log('--- [INSPECCIÓN FORENSE] TIPO Y CONTENIDO DE SALIDA ---');
    console.log('Tipo de retorno:', typeof resultadoCompilacion);
    console.log('Claves encontradas:', Object.keys(resultadoCompilacion));
    console.log('-----------------------------------------------------\n');

    // 3. Proyección canónica independiente
    // Utilizamos específicamente la propiedad 'xhtml' descubierta en la inspección
    const xhtmlString = resultadoCompilacion.xhtml;
    
    const canonicalAst = ASTCanonicalizer.canonicalize(ast);
    const canonicalDom = DOMCanonicalizer.canonicalize(xhtmlString);

    // 4. Auditoría de Identidad (FID-01)
    const report = FID01IdentityAssertion.validate(canonicalAst, canonicalDom);

    // 5. Reporte estructurado
    console.log('CANONICALIZATION');
    console.log(` AST canonical nodes:  ${canonicalAst.nodes.length}`);
    console.log(` DOM canonical nodes:  ${canonicalDom.nodes.length}\n`);

    console.log(`FID-01 — IDENTITY (${report.status})`);
    console.log(` Matched:              ${report.metrics.matched}`);
    console.log(` Missing AST → DOM:    ${report.metrics.missing}`);
    console.log(` Unmapped DOM → AST:   ${report.metrics.unmapped}`);
    console.log(` Duplicates:           ${report.metrics.duplicates}`);
    console.log(` Unstable/ND:          ${report.metrics.unstable}`);
    
    if (report.diagnostics.length > 0) {
        console.log('\nDIAGNOSTICS:');
        report.diagnostics.slice(0, 10).forEach(d => {
            console.log(` [${d.code}] ${d.canonicalId || 'N/A'}: ${d.message}`);
        });
        if (report.diagnostics.length > 10) console.log(' ... (limitado a 10)');
    }

    console.log('\n====================================================\n');
}

runAudit();