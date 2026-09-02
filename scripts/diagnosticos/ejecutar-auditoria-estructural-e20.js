/**
 * E20.5.3 / E20.5.4 — Real Corpus Structural Mass Execution
 * 
 * - Consume el baseline histórico E20.3 / E20.2.4 y el archivo fragmento.json original.
 * - Ejecuta el StructuralAdapter certificado sobre los 78 dossiers reales del corpus.
 * - Genera un artefacto de auditoría estructural independiente: salidaXHTML/e20-structural-audit-report.json.
 * - Garantiza cero mutaciones a los baselines históricos y trazabilidad completa.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const ASTCanonicalizer = require('../src/validadores/E18/ASTCanonicalizer');
const StructuralAdapter = require('../src/validadores/E20/StructuralAdapter');

function ejecutarAuditoriaEstructuralRealE20() {
    console.log('====================================================');
    console.log('  📊 E20.5.3/4: REAL CORPUS STRUCTURAL MASS EXECUTION');
    console.log('====================================================\n');

    const historicalReportPath = path.join(__dirname, '../salidaXHTML/e20-mass-corpus-audit-report.json');
    const astPath = path.join(__dirname, '../salidaXHTML/fragmento.json');

    if (!fs.existsSync(historicalReportPath) || !fs.existsSync(astPath)) {
        console.error('❌ ERROR: No se encuentra el reporte histórico o fragmento.json.');
        return;
    }

    const historicalData = JSON.parse(fs.readFileSync(historicalReportPath, 'utf8'));
    const dossiers = historicalData.dossiers || [];
    const astRaw = JSON.parse(fs.readFileSync(astPath, 'utf8'));
    const astCanonical = ASTCanonicalizer.canonicalize(astRaw);

    // Ejecutar la adaptación y resolución estructural masiva a través del StructuralAdapter certificado
    const structuralReport = StructuralAdapter.processCorpus({
        dossiers: dossiers,
        astNodes: astCanonical.nodes,
        evaluationVersion: '1.0.0'
    });

    console.log('====================================================');
    console.log('E20.5 — STRUCTURAL AUDIT SUMMARY RESULTS');
    console.log('====================================================\n');
    console.log(`Total Dossiers Evaluated:        ${structuralReport.summary.totalDossiers}`);
    console.log(`Composite Blocks Detected:       ${structuralReport.summary.compositeBlocks}`);
    console.log(`Atomic Blocks (ATOMIC_BLOCK):    ${structuralReport.summary.atomicBlocks}`);
    console.log(`Unknown / Unresolved (UNKNOWN):  ${structuralReport.summary.unknownCount}\n`);

    console.log('Invariants & Safety Check:');
    console.log(`  Orphan Inputs:                 ${structuralReport.invariantsCheck.orphanInputs}`);
    console.log(`  Baseline Mutations:            ${structuralReport.invariantsCheck.baselineMutations} (Protected)`);
    console.log(`  Provenance Failures:           ${structuralReport.invariantsCheck.provenanceFailures}`);

    const outputReportPath = path.join(__dirname, '../salidaXHTML/e20-structural-audit-report.json');
    fs.writeFileSync(outputReportPath, JSON.stringify(structuralReport, null, 2), 'utf8');
    console.log(`\n📁 Reporte de auditoría estructural guardado en: ${outputReportPath}`);
    console.log('====================================================\n');
}

ejecutarAuditoriaEstructuralRealE20();