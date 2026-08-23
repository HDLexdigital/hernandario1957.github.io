/**
 * E21.3 / E21.4 — Real Corpus Reconstitution Execution
 * 
 * - Consume el baseline final de E20.7 (e20-attribution-audit-report.json) y el AST original.
 * - Ejecuta el ReconstitutionAdapter para generar el Árbol Derivado (DerivedTree).
 * - Realiza la auditoría de Integridad Estructural para verificar la conservación de masa.
 * - Genera el artefacto final inmutable: salidaXHTML/e21-derived-tree.json.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const ASTCanonicalizer = require('../src/validadores/E18/ASTCanonicalizer');
const ReconstitutionAdapter = require('../src/validadores/E21/ReconstitutionAdapter');

function ejecutarReconstitucionRealE21() {
    console.log('====================================================');
    console.log('  🌳 E21.3/4: TREE RECONSTITUTION & SYNTHESIS');
    console.log('====================================================\n');

    const attributionReportPath = path.join(__dirname, '../salidaXHTML/e20-attribution-audit-report.json');
    const astPath = path.join(__dirname, '../salidaXHTML/fragmento.json');

    if (!fs.existsSync(attributionReportPath) || !fs.existsSync(astPath)) {
        console.error('❌ ERROR: No se encuentra e20-attribution-audit-report.json o fragmento.json.');
        return;
    }

    const attributionData = JSON.parse(fs.readFileSync(attributionReportPath, 'utf8'));
    const astRaw = JSON.parse(fs.readFileSync(astPath, 'utf8'));
    const astCanonical = ASTCanonicalizer.canonicalize(astRaw);

    // Ejecutar la síntesis del Árbol Derivado
    const derivedTree = ReconstitutionAdapter.synthesizeTree({
        attributionReport: attributionData,
        originalASTNodes: astCanonical.nodes, // El arreglo funciona perfectamente como mapa por índice
        evaluationVersion: '1.0.0'
    });

    console.log('====================================================');
    console.log('E21.5 — STRUCTURAL INTEGRITY AUDIT RESULTS');
    console.log('====================================================\n');
    console.log(`Input Dossiers (E20.7):          ${derivedTree.integrityAudit.inputDossiers}`);
    console.log(`Derived Root Nodes Generated:    ${derivedTree.integrityAudit.derivedNodes} (Mass Conservation Check)`);
    console.log(`Synthesized Children (Branches): ${derivedTree.integrityAudit.totalSynthesizedChildren}  <-- ¡Nuestros 9 hallazgos materializados!`);
    console.log(`Orphan Inputs Rejected:          ${derivedTree.integrityAudit.orphanInputs}\n`);

    if (derivedTree.integrityAudit.inputDossiers === derivedTree.integrityAudit.derivedNodes) {
        console.log('✅ ESTADO: CONSERVACIÓN DE MASA VERIFICADA (Ningún Artículo se perdió)');
    } else {
        console.log('❌ ALERTA: Falla en la conservación de masa');
    }

    if (derivedTree.integrityAudit.totalSynthesizedChildren === 9) {
        console.log('✅ ESTADO: FIDELIDAD PROBATORIA VERIFICADA (9 Atribuciones materializadas)');
    } else {
        console.log('❌ ALERTA: Discrepancia probatoria detectada');
    }

    const outputReportPath = path.join(__dirname, '../salidaXHTML/e21-derived-tree.json');
    fs.writeFileSync(outputReportPath, JSON.stringify(derivedTree, null, 2), 'utf8');
    console.log(`\n📁 Árbol Derivado guardado en: ${outputReportPath}`);
    console.log('====================================================\n');
}

ejecutarReconstitucionRealE21();