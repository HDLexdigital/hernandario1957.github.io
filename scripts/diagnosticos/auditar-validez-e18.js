/**
 * E18.3.5 — Auditoría Empírica Discriminante de Dos Niveles (Topología vs. Whitespace)
 * Separa estrictamente la validez topológica estructural de la evidencia de contenido,
 * aislando los artefactos de espaciado de InDesign de las sobreabsorciones reales.
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

function compactWhitespace(text) {
    return String(text || '')
        .normalize('NFC')
        .replace(/\s+/g, '');
}

function ejecutarAuditoriaDiscriminanteE18() {
    console.log('====================================================');
    console.log('  🔍 E18.3.5: AUDITORÍA DISCRIMINANTE (TOPOLOGÍA VS WHITESPACE)');
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

    const astCanonical = ASTCanonicalizer.canonicalize(astReal);
    const domCanonical = DOMCanonicalizer.canonicalize(domTree);

    const astExtraction = StructuralAnchorExtractor.extract(astCanonical);
    const domExtraction = StructuralAnchorExtractor.extract(domCanonical);

    const alignmentMap = AnchorAlignmentEngine.align(astCanonical, domCanonical, astExtraction, domExtraction);
    const reconciliationReport = RangeAwareReconciler.reconcile(astCanonical, domCanonical, alignmentMap);

    const complexBlocks = reconciliationReport.reconciliations.filter(
        r => r.status === 'ALIGN.MERGE' || r.status === 'ALIGN.SPLIT'
    );

    const auditResults = {
        trueMerge: 0,
        trueSplit: 0,
        trueSplitWhitespaceVariation: 0,
        overAbsorption: 0,
        uncertain: 0,
        details: []
    };

    complexBlocks.forEach((rec, idx) => {
        let topologyValid = false;
        let contentMode = 'UNKNOWN';
        let classification = 'WINDOW_OVER_ABSORPTION';
        let rationale = '';

        if (rec.status === 'ALIGN.MERGE') {
            const [astStart, astEnd] = rec.astRange;
            const domIdx = rec.domRange[0];
            const domNode = domCanonical.nodes[domIdx];

            if (astStart !== undefined && astEnd !== undefined && domNode) {
                let allNodesPresent = true;
                for (let k = astStart + 1; k <= astEnd; k++) {
                    const astNode = astCanonical.nodes[k];
                    if (astNode && astNode.normalizedText) {
                        const snippet = astNode.normalizedText.substring(0, 15).trim();
                        const compactSnippet = compactWhitespace(snippet);
                        const compactDom = compactWhitespace(domNode.normalizedText);
                        if (!compactDom.includes(compactSnippet)) {
                            allNodesPresent = false;
                            break;
                        }
                    }
                }

                if (allNodesPresent) {
                    topologyValid = true;
                    classification = 'TRUE_MERGE';
                    rationale = 'El nodo DOM contiene físicamente todos los nodos AST del rango.';
                    auditResults.trueMerge++;
                } else {
                    rationale = 'El rango AST abarca nodos cuya evidencia física no está en el DOM.';
                    auditResults.overAbsorption++;
                }
            }
        } else if (rec.status === 'ALIGN.SPLIT') {
            const astIdx = rec.astRange[0];
            const [domStart, domEnd] = rec.domRange;
            const astNode = astCanonical.nodes[astIdx];

            if (astNode && domStart !== undefined && domEnd !== undefined) {
                const domCollation = RangeTextCollator.collate(domCanonical, rec.domRange);
                const isStructuralSplit = domCollation.nodeCount > 1;

                if (isStructuralSplit) {
                    topologyValid = true;
                    const astCompact = compactWhitespace(astNode.normalizedText);
                    const domCompact = compactWhitespace(domCollation.collatedText);

                    if (domCompact.includes(astCompact.substring(0, Math.min(30, astCompact.length)))) {
                        if (astNode.normalizedText === domCollation.collatedText) {
                            contentMode = 'EXACT_MATCH';
                            classification = 'TRUE_SPLIT';
                            auditResults.trueSplit++;
                        } else {
                            contentMode = 'WHITESPACE_COMPACT_EQUIVALENT';
                            classification = 'TRUE_SPLIT_WITH_WHITESPACE_VARIATION';
                            auditResults.trueSplitWhitespaceVariation++;
                        }
                        rationale = `Split topológicamente válido con evidencia de contenido (${contentMode}).`;
                    } else {
                        contentMode = 'CONTENT_MISMATCH';
                        classification = 'WINDOW_OVER_ABSORPTION';
                        auditResults.overAbsorption++;
                        rationale = 'El rango DOM asignado supera la contención física del nodo AST.';
                    }
                } else {
                    rationale = 'El rango DOM asignado no presenta fragmentación multi-nodo real.';
                    auditResults.overAbsorption++;
                }
            }
        } else {
            auditResults.uncertain++;
        }

        auditResults.details.push({
            blockIndex: idx + 1,
            topology: rec.status,
            astRange: rec.astRange,
            domRange: rec.domRange,
            topologyValid,
            contentEvidenceMode: contentMode,
            physicalValidity: classification,
            rationale
        });
    });

    console.log('📊 RESUMEN DISCRIMINANTE DE VALIDEZ FÍSICA (E18.3.5):');
    console.log(`- Total de bloques complejos evaluados: ${complexBlocks.length}`);
    console.log(`- Fusiones Reales (TRUE_MERGE): ${auditResults.trueMerge}`);
    console.log(`- Fragmentaciones Reales Exactas (TRUE_SPLIT): ${auditResults.trueSplit}`);
    console.log(`- Fragmentaciones con Variación de Whitespace (TRUE_SPLIT_WITH_WHITESPACE_VARIATION): ${auditResults.trueSplitWhitespaceVariation}`);
    console.log(`- Defectos Reales de Sobreabsorción (WINDOW_OVER_ABSORPTION): ${auditResults.overAbsorption}`);
    console.log(`- Casos inciertos (ALIGNMENT_UNCERTAIN): ${auditResults.uncertain}`);

    const reportPath = path.join(__dirname, '../salidaXHTML/e18-discriminant-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2), 'utf8');
    console.log(`\n📁 Reporte discriminante guardado en: ${reportPath}`);
    console.log('====================================================\n');
}

ejecutarAuditoriaDiscriminanteE18();