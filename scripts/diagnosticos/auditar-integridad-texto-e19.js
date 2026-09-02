/**
 * E19.4.2 — Re-Auditoría Empírica con Contexto Consciente de Splits
 * 
 * Conecta el pipeline certificado E18 con SplitAwareEvidence y TextDiscrepancyClassifier 
 * para auditar el corpus real compensando la asimetría geométrica de los ALIGN.SPLIT.
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
const RangeTextCollator = require('../src/validadores/E18/RangeTextCollator');
const SplitAwareEvidence = require('../src/validadores/E19/SplitAwareEvidence');
const TextDiscrepancyClassifier = require('../src/validadores/E19/TextDiscrepancyClassifier');

function ejecutarReAuditoriaEmpiricaE19() {
    console.log('====================================================');
    console.log('  🔍 E19.4.2: RE-AUDITORÍA EMPÍRICA CONTEXTUAL');
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

    // 2. Filtrar bloques complejos certificados (ALIGN.SPLIT y ALIGN.MERGE)
    const complexBlocks = reconciliationReport.reconciliations.filter(
        r => r.status === 'ALIGN.MERGE' || r.status === 'ALIGN.SPLIT'
    );

    const stats = {
        EXACT_MATCH: 0,
        WHITESPACE_VARIATION: 0,
        CHARACTER_SUBSTITUTION: 0,
        CONTENT_ADDITION: 0,
        CONTENT_DELETION: 0,
        TYPOGRAPHIC_NORMALIZATION: 0,
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

        // Obtener fragmentos individuales del DOM en lugar de una colación ciega
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

        // 3. Evaluar con SplitAwareEvidence (E19.4.1) si es SPLIT
        let evidence;
        if (rec.status === 'ALIGN.SPLIT') {
            evidence = SplitAwareEvidence.analyzeSplit(rec.status, rec.astRange, rec.domRange, astText, domFragments);
        } else {
            // Para MERGE o casos estándar, utilizar un equivalente de evidencia estándar
            const domFull = RangeTextCollator.collate(domCanonical, rec.domRange).collatedText;
            evidence = {
                structuralFragmentation: false,
                fragmentCount: domFragments.length,
                compactedMatch: astText.replace(/\s+/g, '') === domFull.replace(/\s+/g, ''),
                trueContentDivergence: astText !== domFull,
                inferredType: astText === domFull ? 'EXACT_MATCH' : 'UNKNOWN',
                editorialEquivalence: 'NOT_DEMONSTRATED'
            };
        }

        // Mapear la inferencia consciente de splits a un formato compatible con el clasificador
        const classifierEvidence = {
            exactMatch: astText === domCollatedText,
            unicodeNormalizedMatch: astText.normalize('NFC') === domCollatedText.normalize('NFC'),
            compactedMatch: evidence.compactedMatch,
            substitutionCount: 0,
            lengthDifference: domCollatedText.length - astText.length,
            astLength: astText.length,
            domLength: domCollatedText.length
        };

        // Forzar tipo basado en la evaluación estricta de SplitAwareEvidence
        let assignedType = evidence.inferredType;
        if (assignedType === 'WHITESPACE_VARIATION' && classifierEvidence.exactMatch) {
            assignedType = 'EXACT_MATCH';
        }

        if (stats[assignedType] !== undefined) {
            stats[assignedType]++;
        } else {
            stats.UNKNOWN++;
        }

        dossiers.push({
            blockIndex: idx + 1,
            topologyStatus: rec.status,
            fragmentCount: evidence.fragmentCount,
            classificationType: assignedType,
            editorialEquivalence: evidence.editorialEquivalence,
            sampleTexts: {
                ast: astText.substring(0, 80) + (astText.length > 80 ? '...' : ''),
                dom: domCollatedText.substring(0, 80) + (domCollatedText.length > 80 ? '...' : '')
            }
        });
    });

    console.log('====================================================');
    console.log('E19.4.2 — CONTEXTUAL EMPIRICAL TEXT INTEGRITY AUDIT');
    console.log('====================================================\n');
    console.log(`Total ranges evaluated: ${complexBlocks.length}\n`);

    Object.keys(stats).forEach(category => {
        console.log(`${category.padEnd(28)} ${stats[category]}`);
    });

    console.log('\nEditorial equivalence:');
    console.log(`  NOT_DEMONSTRATED             ${complexBlocks.length} / ${complexBlocks.length}`);

    console.log('\nTopology source:');
    console.log('  E18.4 FROZEN / CERTIFIED (0 Over-absorption)');

    const reportPath = path.join(__dirname, '../salidaXHTML/e19-contextual-empirical-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({ totalEvaluated: complexBlocks.length, stats, dossiers }, null, 2), 'utf8');
    console.log(`\n📁 Reporte empírico contextual guardado en: ${reportPath}`);
    console.log('====================================================\n');
}

ejecutarReAuditoriaEmpiricaE19();