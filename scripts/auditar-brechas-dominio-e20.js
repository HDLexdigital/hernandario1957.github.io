/**
 * E20.3.4 — Domain Gap Analysis sobre el Corpus Real
 * 
 * - Consume el reporte de mass audit congelado en E20.2.4 (salidaXHTML/e20-mass-corpus-audit-report.json).
 * - Ejecuta el DomainGapAnalyzer certificado para calcular distribución y CCR.
 * - Genera un artefacto de reporte independiente sin mutar el baseline histórico.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const DomainGapAnalyzer = require('../src/validadores/E20/DomainGapAnalyzer');

function ejecutarAnalisisBrechasE20() {
    console.log('====================================================');
    console.log('  🔍 E20.3.4: DOMAIN GAP ANALYSIS (REAL CORPUS)');
    console.log('====================================================\n');

    const reportPath = path.join(__dirname, '../salidaXHTML/e20-mass-corpus-audit-report.json');

    if (!fs.existsSync(reportPath)) {
        console.error(`❌ ERROR: No se encontró el baseline E20.2.4 en ${reportPath}`);
        console.error('Ejecuta primero la auditoría masiva E20.2.3.');
        return;
    }

    const baselineData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const dossiers = baselineData.dossiers || [];

    // Ejecutar el analizador de brechas certificado
    const gapAnalysis = DomainGapAnalyzer.analyze({ baselineDossiers: dossiers });

    console.log('====================================================');
    console.log('E20.3.4 — DOMAIN GAP ANALYSIS RESULTS');
    console.log('E20.3.4 — DOMAIN GAP ANALYSIS RESULTS');
    console.log('====================================================\n');
    console.log(`Total Dossiers Evaluated:        ${gapAnalysis.taxonomicMetrics.totalDossiers}`);
    console.log(`Category Concentration (CCR):    ${gapAnalysis.taxonomicMetrics.categoryConcentrationRatio.toFixed(4)}`);
    console.log(`Over-generalization Risk:        ${gapAnalysis.gapFindings.overGeneralizationRisk ? '⚠️ HIGH (Rule over-absorption suspected)' : '✅ LOW'}\n`);

    console.log('Taxonomic Distribution:');
    Object.keys(gapAnalysis.distribution).forEach(type => {
        const count = gapAnalysis.distribution[type];
        const ratio = ((count / gapAnalysis.taxonomicMetrics.totalDossiers) * 100).toFixed(2);
        console.log(`  ${type.padEnd(25)} ${String(count).padEnd(5)} (${ratio}%)`);
    });

    console.log('\nTraceability & Linage:');
    console.log(`  Baseline Version:              ${gapAnalysis.traceability.baselineVersion}`);
    console.log(`  Analyzer Version:              ${gapAnalysis.traceability.analyzerVersion}`);

    const outputGapPath = path.join(__dirname, '../salidaXHTML/e20-domain-gap-analysis-report.json');
    fs.writeFileSync(outputGapPath, JSON.stringify(gapAnalysis, null, 2), 'utf8');
    console.log(`\n📁 Reporte de brechas de dominio guardado en: ${outputGapPath}`);
    console.log('====================================================\n');
}

ejecutarAnalisisBrechasE20();