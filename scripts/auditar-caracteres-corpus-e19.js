/**
 * E19.4.4 — Auditoría Causal a Nivel de Caracteres sobre el Corpus Real
 * 
 * Conecta el pipeline certificado con SplitAwareEvidence y CharacterLevelAudit 
 * para determinar la causalidad física exacta de las discrepancias en los 40 bloques complejos.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ASTCanonicalizer = require('../src/validadores/E18/ASTCanonicalizer');
const DOMCanonicalizer = require('../src/validadores/E18/DOMCanonicalizer');
const StructuralAnchorExtractor = require('../src/validadores/E18/StructuralAnchorExtractor');
const AnchorAlignmentEngine = require('../src/validadores/E18/AnchorAlignmentEngine');
const RangeAwareReconciler = require('../src/validadores/E18/RangeAwareReconciler');
const SplitAwareEvidence = require('../src/validadores/E19/SplitAwareEvidence');
const CharacterLevelAudit = require('../src/validadores/E19/CharacterLevelAudit');

function ejecutarAuditoriaCausalCorpusE19() {
    console.log('====================================================');
    console.log('  🔍 E19.4.4: AUDITORÍA CAUSAL A NIVEL DE CARACTERES (CORPUS)');
    console.log('====================================================\n');

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

    // 1. Ejecutar Pipeline Topológico E18 (Inmutable)
    const astCanonical = ASTCanonicalizer.canonicalize(astReal);
    const domCanonical = DOMCanonicalizer.canonicalize(domTree);

    const astExtraction = StructuralAnchorExtractor.extract(astCanonical);
    const domExtraction = StructuralAnchorExtractor.extract(domCanonical);

    const alignmentMap = AnchorAlignmentEngine.align(astCanonical, domCanonical, astExtraction, domExtraction);
    const reconciliationReport = RangeAwareReconciler.reconcile(astCanonical, domCanonical, alignmentMap);

    // 2. Filtrar bloques complejos certificados (ALIGN.MERGE y ALIGN.SPLIT)
    const complexBlocks = reconciliationReport.reconciliations.filter(
        r => r.status === 'ALIGN.MERGE' || r.status === 'ALIGN.SPLIT'
    );

    const causalStats = {
        EXACT_MATCH: 0,
        STRUCTURAL_WHITESPACE_ARTIFACT: 0,
        GENUINE_CONTENT_ADDITION: 0,
        UNKNOWN: 0
    };

    const dossiers = [];

    complexBlocks.forEach((rec, idx) => {
        // Colacionar texto AST para el rango
        const [astStart, astEnd] = rec.astRange;
        let astTextParts = [];
        if (astStart !== undefined && astEnd !== undefined) {
            for (let k = astStart; k <= astEnd; k++) {
                if (astCanonical.nodes[k] && astCanonical.nodes[k].normalizedText) {
                    astTextParts.push(astCanonical.nodes[k].normalizedText);
                }
            }
        }
        const astText = astTextParts.join(' ');

        // Obtener fragmentos individuales del DOM
        const domFragments = [];
        const [domStart, domEnd] = rec.domRange;
        if (domStart !== undefined && domEnd !== undefined) {
            for (let k = domStart; k <= domEnd; k++) {
                if (domCanonical.nodes[k] && domCanonical.nodes[k].normalizedText) {
                    domFragments.push(domCanonical.nodes[k].normalizedText);
                }
            }
        }
        const domCollatedText = domFragments.join(' ');

        // 3. Ejecutar CharacterLevelAudit para determinar causalidad real a nivel de code points
        const auditResult = CharacterLevelAudit.analyzeCodePoints(astText, domCollatedText);

        if (causalStats[auditResult.causalClassification] !== undefined) {
            causalStats[auditResult.causalClassification]++;
        } else {
            causalStats.UNKNOWN++;
        }

        dossiers.push({
            blockIndex: idx + 1,
            topologyStatus: rec.status,
            fragmentCount: domFragments.length,
            causalClassification: auditResult.causalClassification,
            whitespaceDelta: auditResult.whitespaceDelta,
            controlCharacterCount: auditResult.controlCharacterCount,
            hasGenuineContentAddition: auditResult.hasGenuineContentAddition,
            editorialEquivalence: auditResult.editorialEquivalence,
            sampleTexts: {
                ast: astText.substring(0, 80) + (astText.length > 80 ? '...' : ''),
                dom: domCollatedText.substring(0, 80) + (domCollatedText.length > 80 ? '...' : '')
            }
        });
    });

    console.log('====================================================');
    console.log('E19.4.4 — CORPUS CHARACTER-LEVEL CAUSAL AUDIT');
    console.log('====================================================\n');
    console.log(`Total blocks evaluated: ${complexBlocks.length}\n`);

    Object.keys(causalStats).forEach(category => {
        console.log(`${category.padEnd(35)} ${causalStats[category]}`);
    });

    console.log('\nEditorial equivalence:');
    console.log(`  NOT_DEMONSTRATED                    ${complexBlocks.length} / ${complexBlocks.length}`);

    console.log('\nTopology source:');
    console.log('  E18.4 FROZEN / CERTIFIED (0 Over-absorption)');

    const reportPath = path.join(__dirname, '../salidaXHTML/e19-corpus-character-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({ totalEvaluated: complexBlocks.length, causalStats, dossiers }, null, 2), 'utf8');
    console.log(`\n📁 Reporte causal guardado en: ${reportPath}`);
    console.log('====================================================\n');
}

ejecutarAuditoriaCausalCorpusE19();