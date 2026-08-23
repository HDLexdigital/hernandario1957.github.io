/**
 * E20.4.3 — Real Corpus Relation Mass Execution
 * 
 * - Consume el baseline histórico E20.3 / E20.2.4 y el archivo fragmento.json original.
 * - Ejecuta el RelationAdapter certificado sobre los 78 dossiers reales del corpus.
 * - Genera un artefacto de auditoría relacional independiente: salidaXHTML/e20-relation-audit-report.json.
 * - Garantiza cero mutaciones a los baselines históricos.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const ASTCanonicalizer = require('../src/validadores/E18/ASTCanonicalizer');
const RelationAdapter = require('../src/validadores/E20/RelationAdapter');

function ejecutarAuditoriaRelacionalRealE20() {
    console.log('====================================================');
    console.log('  📊 E20.4.3: REAL CORPUS RELATION MASS EXECUTION');
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

    // Ejecutar la adaptación y evaluación masiva a través del RelationAdapter certificado
    const relationReport = RelationAdapter.processCorpus({
        dossiers: dossiers,
        astNodes: astCanonical.nodes,
        evaluationVersion: '1.0.0'
    });

    console.log('====================================================');
    console.log('E20.4.3 — RELATION AUDIT SUMMARY RESULTS');
    console.log('====================================================\n');
    console.log(`Total Dossiers Evaluated:        ${relationReport.summary.totalDossiers}`);
    console.log(`Explicit Relations Detected:     ${relationReport.summary.relationsDetected}`);
    console.log(`Unknown / Unrelated (UNKNOWN):   ${relationReport.summary.unknownCount}\n`);

    console.log('Invariants & Safety Check:');
    console.log(`  Orphan Relations:              ${relationReport.invariantsCheck.orphanRelations}`);
    console.log(`  Baseline Mutations:            ${relationReport.invariantsCheck.baselineMutations} (Protected)`);
    console.log(`  Traceability Failures:         ${relationReport.invariantsCheck.traceabilityFailures}`);

    const outputReportPath = path.join(__dirname, '../salidaXHTML/e20-relation-audit-report.json');
    fs.writeFileSync(outputReportPath, JSON.stringify(relationReport, null, 2), 'utf8');
    console.log(`\n📁 Reporte de auditoría relacional guardado en: ${outputReportPath}`);
    console.log('====================================================\n');
}

ejecutarAuditoriaRelacionalRealE20();