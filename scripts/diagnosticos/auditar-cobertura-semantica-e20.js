/**
 * E20.3.2 — Corpus Coverage Inventory (Auditoría Empírica de Cobertura)
 * 
 * - Consume el reporte de mass audit congelado en E20.2.4 (salidaXHTML/e20-mass-corpus-audit-report.json).
 * - Ejecuta el CoverageEngine certificado para calcular métricas objetivas de cobertura.
 * - Genera un reporte JSON de cobertura histórica con trazabilidad completa.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const CoverageEngine = require('../src/validadores/E20/CoverageEngine');

function ejecutarAuditoriaCoberturaE20() {
    console.log('====================================================');
    console.log('  📊 E20.3.2: CORPUS COVERAGE INVENTORY AUDIT');
    console.log('====================================================\n');

    const reportPath = path.join(__dirname, '../salidaXHTML/e20-mass-corpus-audit-report.json');

    if (!fs.existsSync(reportPath)) {
        console.error(`❌ ERROR: No se encontró el baseline E20.2.4 en ${reportPath}`);
        console.error('Ejecuta primero la auditoría masiva E20.2.3 para generar el reporte base.');
        return;
    }

    const baselineData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const dossiers = baselineData.dossiers || [];

    // Mapear los dossiers del reporte masivo al formato esperado por CoverageEngine
    const normalizedDossiers = dossiers.map(d => ({
        alignmentId: d.alignmentId,
        claim: {
            status: d.status || (d.semanticClassification !== 'UNKNOWN' ? 'VALIDATED' : 'UNKNOWN'),
            semanticType: d.semanticClassification || 'UNKNOWN'
        },
        traceability: {
            e18EvidenceRef: d.e18EvidenceRef,
            e19EvidenceRef: d.e19EvidenceRef
        }
    }));

    const coverageReport = CoverageEngine.evaluateCoverage({
        dossiers: normalizedDossiers,
        evaluationVersion: '1.0.0'
    });

    console.log('====================================================');
    console.log('E20.3.2 — COVERAGE INVENTORY RESULTS');
    console.log('====================================================\n');
    console.log(`Total Dossiers Evaluated:  ${coverageReport.metrics.totalEvaluated}`);
    console.log(`Covered Entities:          ${coverageReport.metrics.coveredCount}`);
    console.log(`Unknown / Unrecognized:    ${coverageReport.metrics.unknownCount}`);
    console.log(`Coverage Ratio:            ${(coverageReport.metrics.coverageRatio * 100).toFixed(2)}%\n`);

    console.log('Uncertainty Breakdown:');
    console.log(`  Unrecognized Structure:  ${coverageReport.uncertaintyBreakdown.unrecognizedStructure}`);

    console.log('\nTraceability & Linage:');
    console.log(`  Baseline Version:        ${coverageReport.traceabilityChainRef.baselineVersion}`);
    console.log(`  Evaluation Version:      ${coverageReport.traceabilityChainRef.evaluationVersion}`);

    const outputCoveragePath = path.join(__dirname, '../salidaXHTML/e20-corpus-coverage-report.json');
    fs.writeFileSync(outputCoveragePath, JSON.stringify(coverageReport, null, 2), 'utf8');
    console.log(`\n📁 Reporte de cobertura guardado en: ${outputCoveragePath}`);
    console.log('====================================================\n');
}

ejecutarAuditoriaCoberturaE20();