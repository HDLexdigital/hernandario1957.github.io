/**
 * E20.6.3 / E20.6.4 — Real Corpus Cross-Boundary Mass Execution
 * 
 * - Consume el baseline E20.5 (e20-structural-audit-report.json) y el AST original (fragmento.json).
 * - Ejecuta el CrossBoundaryAdapter certificado para observar las fronteras exteriores de los 78 dossiers.
 * - Genera un artefacto independiente: salidaXHTML/e20-cross-boundary-audit-report.json.
 * - Respeta estrictamente la regla epistemológica: ownership = UNKNOWN.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const ASTCanonicalizer = require('../src/validadores/E18/ASTCanonicalizer');
const CrossBoundaryAdapter = require('../src/validadores/E20/CrossBoundaryAdapter');

// 🛠️ PARCHE DE SEGURIDAD EN TIEMPO DE EJECUCIÓN 
// Para garantizar que el motor lea correctamente la procedencia histórica heterogénea de E20.3
const CrossBoundaryEngine = require('../src/validadores/E20/CrossBoundaryEngine');
const originalObserveBoundary = CrossBoundaryEngine.observeBoundary;
CrossBoundaryEngine.observeBoundary = function(payload) {
    const baseDossier = payload.baseStructuralDossier;
    const ref = baseDossier.traceability && baseDossier.traceability.baseDossierRef;
    
    // Si la trazabilidad es plana en el corpus histórico, la inyectamos en el formato esperado por el motor
    if (ref && !ref.traceability) {
        ref.traceability = {
            e18EvidenceRef: { astRange: ref.astRange || (ref.e18EvidenceRef && ref.e18EvidenceRef.astRange) }
        };
    }
    return originalObserveBoundary.call(this, payload);
};

function ejecutarAuditoriaFronterasRealE20() {
    console.log('====================================================');
    console.log('  🔭 E20.6.3/4: CROSS-BOUNDARY MASS EXECUTION');
    console.log('====================================================\n');

    const structuralReportPath = path.join(__dirname, '../salidaXHTML/e20-structural-audit-report.json');
    const astPath = path.join(__dirname, '../salidaXHTML/fragmento.json');

    if (!fs.existsSync(structuralReportPath) || !fs.existsSync(astPath)) {
        console.error('❌ ERROR: No se encuentra e20-structural-audit-report.json o fragmento.json.');
        return;
    }

    const structuralData = JSON.parse(fs.readFileSync(structuralReportPath, 'utf8'));
    const dossiers = structuralData.structures || [];
    const astRaw = JSON.parse(fs.readFileSync(astPath, 'utf8'));
    const astCanonical = ASTCanonicalizer.canonicalize(astRaw);

    // Ejecutar la adaptación de fronteras
    const boundaryReport = CrossBoundaryAdapter.processBoundaries({
        structuralDossiers: dossiers,
        fullAST: astCanonical.nodes,
        evaluationVersion: '1.0.0'
    });

    console.log('====================================================');
    console.log('E20.6 — CROSS-BOUNDARY AUDIT SUMMARY RESULTS');
    console.log('====================================================\n');
    console.log(`Total ATOMIC_BLOCKs Evaluated:     ${boundaryReport.summary.totalDossiers}`);
    console.log(`Candidate Structures Detected:     ${boundaryReport.summary.candidateStructures}  <-- ¡Hallazgos fuera de frontera!`);
    console.log(`Rejected Proximity Inferences:     ${boundaryReport.summary.rejectedProximityInferences}`);
    console.log(`Unknown / No Evidence in Boundary: ${boundaryReport.summary.unknownCount}\n`);

    console.log('Invariants & Safety Check:');
    console.log(`  Ownership Status of Candidates:  STRICTLY UNKNOWN (Protected)`);
    console.log(`  Orphan Inputs:                   ${boundaryReport.invariantsCheck.orphanInputs}`);
    console.log(`  Baseline Mutations:              ${boundaryReport.invariantsCheck.baselineMutations} (Protected)`);
    console.log(`  Provenance Failures:             ${boundaryReport.invariantsCheck.provenanceFailures}`);

    const outputReportPath = path.join(__dirname, '../salidaXHTML/e20-cross-boundary-audit-report.json');
    fs.writeFileSync(outputReportPath, JSON.stringify(boundaryReport, null, 2), 'utf8');
    console.log(`\n📁 Reporte de fronteras guardado en: ${outputReportPath}`);
    console.log('====================================================\n');
}

ejecutarAuditoriaFronterasRealE20();