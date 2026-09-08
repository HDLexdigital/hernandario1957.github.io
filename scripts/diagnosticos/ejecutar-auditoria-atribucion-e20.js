/**
 * E20.7.3 / E20.7.4 — Real Corpus Attribution Mass Execution
 * 
 * - Consume el baseline E20.6 (e20-cross-boundary-audit-report.json) y el AST original.
 * - Clasifica la evidencia léxica de los 9 candidatos (PARRAFO, NUMERAL, LITERAL).
 * - Inyecta las Reglas de Dominio explícitas que autorizan la dependencia jerárquica.
 * - Ejecuta el AttributionAdapter para resolver si se otorga OWNERSHIP_CONFIRMED o se retiene en UNKNOWN.
 * - Genera el artefacto final: salidaXHTML/e20-attribution-audit-report.json.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const ASTCanonicalizer = require('../src/validadores/E18/ASTCanonicalizer');
const AttributionAdapter = require('../src/validadores/E20/AttributionAdapter');

function ejecutarAuditoriaAtribucionRealE20() {
    console.log('====================================================');
    console.log('  ⚖️ E20.7.3/4: STRUCTURAL ATTRIBUTION EXECUTION');
    console.log('====================================================\n');

    const crossBoundaryReportPath = path.join(__dirname, '../salidaXHTML/e20-cross-boundary-audit-report.json');
    const astPath = path.join(__dirname, '../salidaXHTML/fragmento.json');

    if (!fs.existsSync(crossBoundaryReportPath) || !fs.existsSync(astPath)) {
        console.error('❌ ERROR: No se encuentra e20-cross-boundary-audit-report.json o fragmento.json.');
        return;
    }

    const crossBoundaryData = JSON.parse(fs.readFileSync(crossBoundaryReportPath, 'utf8'));
    const astRaw = JSON.parse(fs.readFileSync(astPath, 'utf8'));
    const astCanonical = ASTCanonicalizer.canonicalize(astRaw);

    // 1. Enriquecimiento Léxico Previo (Extracción del markerType basado en evidencia textual)
    crossBoundaryData.observations.forEach(obs => {
        obs.boundaryObservation.nodesAnalysis.forEach(node => {
            if (node.claim === 'CANDIDATE_STRUCTURE') {
                const text = astCanonical.nodes[node.astIndex].normalizedText || '';
                if (/\b(?:parágrafo|paragrafo)\b/i.test(text)) {
                    node.markerType = 'PARRAFO';
                } else if (/^\s*\d+[\.\)]\s/.test(text)) {
                    node.markerType = 'NUMERAL';
                } else if (/^\s*[a-z]\)\s/.test(text)) {
                    node.markerType = 'LITERAL';
                } else {
                    node.markerType = 'UNKNOWN_MARKER';
                }
            }
        });
    });

    // 2. Definición del Diccionario Jurídico Explícito (Reglas de Dominio)
    // Solo estas entidades están autorizadas a saltar la frontera y depender del Artículo precedente.
    const domainRules = {
        'PARRAFO': 'DEPENDS_ON_PRECEDING_ARTICULO',
        'NUMERAL': 'DEPENDS_ON_PRECEDING_ARTICULO',
        'LITERAL': 'DEPENDS_ON_PRECEDING_ARTICULO'
    };

    // 3. Ejecución del Adaptador de Atribución
    const attributionReport = AttributionAdapter.processAttributions({
        crossBoundaryReport: crossBoundaryData,
        domainRules: domainRules,
        evaluationVersion: '1.0.0'
    });

    console.log('====================================================');
    console.log('E20.7 — ATTRIBUTION AUDIT SUMMARY RESULTS');
    console.log('====================================================\n');
    console.log(`Total Observations Evaluated:    ${attributionReport.summary.totalObservations}`);
    console.log(`OWNERSHIP_CONFIRMED:             ${attributionReport.summary.ownershipConfirmed}  <-- ¡Candidatos atribuidos legalmente!`);
    console.log(`UNKNOWN (No matching rule):      ${attributionReport.summary.unknownCount}`);
    console.log(`REJECTED_PROXIMITY_INFERENCES:   ${attributionReport.summary.rejectedProximityInferences} (Protected Evidence)\n`);

    console.log('Invariants & Safety Check:');
    console.log(`  Orphan Inputs:                 ${attributionReport.invariantsCheck.orphanInputs}`);
    console.log(`  Baseline Mutations:            ${attributionReport.invariantsCheck.baselineMutations} (Protected)`);
    console.log(`  Provenance Failures:           ${attributionReport.invariantsCheck.provenanceFailures}`);

    const outputReportPath = path.join(__dirname, '../salidaXHTML/e20-attribution-audit-report.json');
    fs.writeFileSync(outputReportPath, JSON.stringify(attributionReport, null, 2), 'utf8');
    console.log(`\n📁 Reporte de atribución guardado en: ${outputReportPath}`);
    console.log('====================================================\n');
}

ejecutarAuditoriaAtribucionRealE20();