/**
 * E18.2.5.5.3 — Auditoría Empírica de Reconciliación por Rangos
 * Ejecuta el pipeline completo sobre el corpus real utilizando el RangeAwareReconciler.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Módulos certificados de la arquitectura
const ASTCanonicalizer = require('../src/validadores/E18/ASTCanonicalizer');
const DOMCanonicalizer = require('../src/validadores/E18/DOMCanonicalizer');
const StructuralAnchorExtractor = require('../src/validadores/E18/StructuralAnchorExtractor');
const AnchorAlignmentEngine = require('../src/validadores/E18/AnchorAlignmentEngine');
const WindowBoundaryResolver = require('../src/validadores/E18/WindowBoundaryResolver');
const RangeAwareReconciler = require('../src/validadores/E18/RangeAwareReconciler');

function ejecutarAuditoriaReconciliacion() {
    console.log('====================================================');
    console.log('  🔍 E18.2.5.5.3: AUDITORÍA EMPÍRICA DE RECONCILIACIÓN');
    console.log('====================================================\n');

    // 1. Cargar AST y XHTML Reales
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

    // 2. Canonización
    const astCanonical = ASTCanonicalizer.canonicalize(astReal);
    const domCanonical = DOMCanonicalizer.canonicalize(domTree);

    // 3. Extracción de Anclajes
    const astExtraction = StructuralAnchorExtractor.extract(astCanonical);
    const domExtraction = StructuralAnchorExtractor.extract(domCanonical);

    // 4. Alineación por Anclajes
    const alignmentMap = AnchorAlignmentEngine.align(astCanonical, domCanonical, astExtraction, domExtraction);

    // 5. Reconciliación Consciente de Rangos (RangeAwareReconciler)
    const reconciliationReport = RangeAwareReconciler.reconcile(astCanonical, domCanonical, alignmentMap);

    // 6. Reporte de Resultados
    const statusCounts = {};
    reconciliationReport.reconciliations.forEach(r => {
        statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    });

    const textStatusCounts = {};
    reconciliationReport.reconciliations.forEach(r => {
        const tStatus = r.text ? r.text.status : 'UNDEFINED';
        textStatusCounts[tStatus] = (textStatusCounts[tStatus] || 0) + 1;
    });

    console.log('📊 RESUMEN DE RECONCILIACIÓN DEL CORPUS REAL:');
    console.log(`- Monotonicidad Preservada: ${reconciliationReport.monotonicityPreserved ? 'SÍ ✅' : 'NO ⚠️'}`);
    console.log(`- Solapamientos Detectados: ${reconciliationReport.hasOverlaps ? 'SÍ ⚠️' : 'NINGUNO ✅'}`);
    console.log('\nDistribución de Estados Topológicos (Alignments):');
    console.table([statusCounts]);

    console.log('\nDistribución de Estados Textuales (Text Status):');
    console.table([textStatusCounts]);

    console.log('\n🔍 MUESTRA DE LOS PRIMEROS 5 BLOQUES RECONCILIADOS:');
    reconciliationReport.reconciliations.slice(0, 5).forEach((rec, idx) => {
        console.log(`----------------------------------------------------`);
        console.log(`[BLOQUE #${idx + 1}] Status: ${rec.status} | Text Status: ${rec.text.status}`);
        console.log(`AST Range: [${rec.astRange.join(', ') || 'VACÍO'}]`);
        console.log(`DOM Range: [${rec.domRange.join(', ') || 'VACÍO'}]`);
    });

    console.log('\n====================================================');
    console.log('  FIN DE LA AUDITORÍA DE RECONCILIACIÓN');
    console.log('====================================================\n');
}

ejecutarAuditoriaReconciliacion();