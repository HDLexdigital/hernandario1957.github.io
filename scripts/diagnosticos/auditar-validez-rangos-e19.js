/**
 * E19.5.2 — Auditoría de Validez Física de Rangos MERGE / SPLIT
 * Inspecciona si los rangos complejos agrupados por la topología representan 
 * fusiones/fragmentaciones reales o defectos de sobreabsorción (Over-Absorption).
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

function auditarValidezRangos() {
    console.log('====================================================');
    console.log('  🔍 E19.5.2: AUDITORÍA DE VALIDEZ FÍSICA DE RANGOS');
    console.log('====================================================\n');

    // 1. Cargar corpus real
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

    // 2. Pipeline E18
    const astCanonical = ASTCanonicalizer.canonicalize(astReal);
    const domCanonical = DOMCanonicalizer.canonicalize(domTree);

    const astExtraction = StructuralAnchorExtractor.extract(astCanonical);
    const domExtraction = StructuralAnchorExtractor.extract(domCanonical);

    const alignmentMap = AnchorAlignmentEngine.align(astCanonical, domCanonical, astExtraction, domExtraction);
    const reconciliationReport = RangeAwareReconciler.reconcile(astCanonical, domCanonical, alignmentMap);

    // 3. Filtrar bloques complejos (MERGE y SPLIT)
    const complexBlocks = reconciliationReport.reconciliations.filter(
        r => r.status === 'ALIGN.MERGE' || r.status === 'ALIGN.SPLIT'
    );

    const auditResults = {
        trueMerge: 0,
        trueSplit: 0,
        overAbsorption: 0,
        uncertain: 0,
        details: []
    };

    complexBlocks.forEach((rec, idx) => {
        let classification = 'UNCERTAIN';
        let reason = '';

        if (rec.status === 'ALIGN.MERGE') {
            const [astStart, astEnd] = rec.astRange;
            const domIdx = rec.domRange[0];
            const domNode = domCanonical.nodes[domIdx];

            if (astStart !== undefined && astEnd !== undefined && domNode) {
                // Verificar si el nodo DOM contiene textualmente los marcadores de todos los nodos AST del rango
                let allNodesPresent = true;
                for (let k = astStart + 1; k <= astEnd; k++) {
                    const astNode = astCanonical.nodes[k];
                    // Si el nodo AST posterior es un artículo y su texto o clave no aparece en el DOM único, hay sobreabsorción
                    if (astNode && astNode.normalizedText) {
                        const snippet = astNode.normalizedText.substring(0, 20); // Primeros caracteres del artículo absorbido
                        if (!domNode.normalizedText.includes(snippet)) {
                            allNodesPresent = false;
                            break;
                        }
                    }
                }

                if (allNodesPresent) {
                    classification = 'TRUE_MERGE';
                    reason = 'El nodo DOM único contiene físicamente el texto de todos los nodos AST del rango.';
                    auditResults.trueMerge++;
                } else {
                    classification = 'WINDOW_OVER_ABSORPTION';
                    reason = 'El rango AST abarca más nodos de los que físicamente contiene el nodo DOM asignado.';
                    auditResults.overAbsorption++;
                }
            }
        } else if (rec.status === 'ALIGN.SPLIT') {
            const astIdx = rec.astRange[0];
            const [domStart, domEnd] = rec.domRange;
            const astNode = astCanonical.nodes[astIdx];

            if (astNode && domStart !== undefined && domEnd !== undefined) {
                // Colacionar el rango DOM completo
                const domCollation = RangeTextCollator.collate(domCanonical, rec.domRange);
                // Si el texto del AST está razonablemente distribuido en los nodos DOM del rango
                if (domCollation.nodeCount > 1 && domCollation.collatedText.includes(astNode.normalizedText.substring(0, 30))) {
                    classification = 'TRUE_SPLIT';
                    reason = 'El nodo AST único está fragmentado y contenido coherentemente en el rango DOM.';
                    auditResults.trueSplit++;
                } else {
                    classification = 'WINDOW_OVER_ABSORPTION';
                    reason = 'El rango DOM asignado no refleja fielmente la fragmentación del nodo AST.';
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
            physicalValidity: classification,
            rationale: reason
        });
    });

    console.log('📊 RESUMEN DE VALIDEZ FÍSICA DE RANGOS (E19.5.2):');
    console.log(`- Total de bloques complejos evaluados: ${complexBlocks.length}`);
    console.log(`- Fusiones Reales (TRUE_MERGE): ${auditResults.trueMerge}`);
    console.log(`- Fragmentaciones Reales (TRUE_SPLIT): ${auditResults.trueSplit}`);
    console.log(`- Defectos de Sobreabsorción (WINDOW_OVER_ABSORPTION): ${auditResults.overAbsorption}`);
    console.log(`- Casos inciertos (ALIGNMENT_UNCERTAIN): ${auditResults.uncertain}`);

    console.log('\n----------------------------------------------------');
    console.log('  MUESTRA FORENSE DE AUDITORÍA (PRIMEROS 5 CASOS)');
    console.log('----------------------------------------------------');

    auditResults.details.slice(0, 5).forEach((item) => {
        console.log(`\n[BLOQUE #${item.blockIndex}] Topología: ${item.topology}`);
        console.log(`  AST Range: [${item.astRange.join(', ')}] | DOM Range: [${item.domRange.join(', ')}]`);
        console.log(`  Validez Física: ${item.physicalValidity}`);
        console.log(`  Diagnóstico: ${item.rationale}`);
    });

    const reportPath = path.join(__dirname, '../salidaXHTML/e19-range-validity-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2), 'utf8');
    console.log(`\n📁 Reporte detallado guardado en: ${reportPath}`);

    console.log('\n====================================================');
    console.log('  FIN DE LA AUDITORÍA DE VALIDEZ FÍSICA E19.5.2');
    console.log('====================================================\n');
}

auditarValidezRangos();