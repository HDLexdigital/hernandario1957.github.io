/**
 * E19.4 — Extracción del Baseline Real de Integridad Textual
 * Consume la salida certificada del pipeline E18.2.5.5 para aislar
 * exclusivamente los TEXT.MISMATCH reales libres de ruido posicional.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Módulos certificados de la arquitectura congelada
const ASTCanonicalizer = require('../src/validadores/E18/ASTCanonicalizer');
const DOMCanonicalizer = require('../src/validadores/E18/DOMCanonicalizer');
const StructuralAnchorExtractor = require('../src/validadores/E18/StructuralAnchorExtractor');
const AnchorAlignmentEngine = require('../src/validadores/E18/AnchorAlignmentEngine');
const RangeAwareReconciler = require('../src/validadores/E18/RangeAwareReconciler');

function extraerBaselineE19() {
    console.log('====================================================');
    console.log('  🔍 E19.4: EXTRACCIÓN DEL NUEVO BASELINE DE MISMATCHES');
    console.log('====================================================\n');

    // 1. Cargar corpus real
    const astPath = path.join(__dirname, '../salidaXHTML/fragmento.json');
    const xhtmlPath = path.join(__dirname, '../salidaXHTML/fragmento.xhtml');

    let astReal = JSON.parse(fs.readFileSync(astPath, 'utf8'));
    let rawXHTML = fs.readFileSync(xhtmlPath, 'utf8');

    const dom = new JSDOM(rawXHTML);
    const document = dom.window.document;
    let domTree = { tag: 'body', contenido: [] };

    document.querySelectorAll('body > p, body > h1, body > h2, body > h3, body > div').forEach((nodo) => {
        domTree.contenido.push({
            tag: nodo.tagName.toLowerCase(),
            classes: Array.from(nodo.classList),
            texto: nodo.textContent
        });
    });

    // 2. Ejecutar pipeline certificado E18
    const astCanonical = ASTCanonicalizer.canonicalize(astReal);
    const domCanonical = DOMCanonicalizer.canonicalize(domTree);

    const astExtraction = StructuralAnchorExtractor.extract(astCanonical);
    const domExtraction = StructuralAnchorExtractor.extract(domCanonical);

    const alignmentMap = AnchorAlignmentEngine.align(astCanonical, domCanonical, astExtraction, domExtraction);
    const reconciliationReport = RangeAwareReconciler.reconcile(astCanonical, domCanonical, alignmentMap);

    // 3. Filtrar y aislar los TEXT.MISMATCH reales
    const mismatches = reconciliationReport.reconciliations.filter(r => r.text && r.text.status === 'TEXT.MISMATCH');
    const exactMatches = reconciliationReport.reconciliations.filter(r => r.text && r.text.status === 'TEXT.MATCH_EXACT');
    const notEvaluated = reconciliationReport.reconciliations.filter(r => r.text && r.text.status === 'NOT_EVALUATED');

    console.log('📊 MÉTRICAS DEL NUEVO BASELINE (E19):');
    console.log(`- Total de bloques reconciliados: ${reconciliationReport.reconciliations.length}`);
    console.log(`- Coincidencias exactas (TEXT.MATCH_EXACT): ${exactMatches.length}`);
    console.log(`- Discrepancias físicas reales (TEXT.MISMATCH): ${mismatches.length}`);
    console.log(`- Bloques complejos pendientes (NOT_EVALUATED): ${notEvaluated.length}`);

    console.log('\n🔍 MUESTRA DE LOS PRIMEROS DISCREPANTES REALES:');
    mismatches.slice(0, 10).forEach((rec, idx) => {
        console.log(`----------------------------------------------------`);
        console.log(`[MISMATCH #${idx + 1}] Topología: ${rec.status}`);
        console.log(`  AST Range: [${rec.astRange.join(', ')}]`);
        console.log(`  DOM Range: [${rec.domRange.join(', ')}]`);
        
        if (rec.astRange.length === 2 && rec.astRange[0] !== undefined) {
            const astTxt = astCanonical.nodes[rec.astRange[0]].normalizedText;
            console.log(`  AST Text: "${astTxt.length > 70 ? astTxt.substring(0, 70) + '...' : astTxt}"`);
        }
        if (rec.domRange.length === 2 && rec.domRange[0] !== undefined) {
            const domTxt = domCanonical.nodes[rec.domRange[0]].normalizedText;
            console.log(`  DOM Text: "${domTxt.length > 70 ? domTxt.substring(0, 70) + '...' : domTxt}"`);
        }
    });

    console.log('\n====================================================');
    console.log('  FIN DE LA EXTRACCIÓN DEL BASELINE E19');
    console.log('====================================================\n');
}

extraerBaselineE19();