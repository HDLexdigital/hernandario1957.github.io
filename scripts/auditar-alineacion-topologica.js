/**
 * E18.2.5.4 — Auditoría Empírica de Alineación Topológica (Anchor-Based)
 * Orquesta la extracción de anclajes y la alineación por AnchorAlignmentEngine
 * sobre el corpus real para verificar la resolución de desvíos estructurales.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Módulos de la arquitectura congelada y probada
const ASTCanonicalizer = require('../src/validadores/E18/ASTCanonicalizer');
const DOMCanonicalizer = require('../src/validadores/E18/DOMCanonicalizer');
const StructuralAnchorExtractor = require('../src/validadores/E18/StructuralAnchorExtractor');
const AnchorAlignmentEngine = require('../src/validadores/E18/AnchorAlignmentEngine');

function ejecutarAuditoriaEmpirica() {
    console.log('====================================================');
    console.log('  🔍 E18.2.5.4: AUDITORÍA EMPÍRICA ANCHOR-BASED');
    console.log('====================================================\n');

    // 1. Cargar AST Real
    const astPath = path.join(__dirname, '../salidaXHTML/fragmento.json');
    let astReal = null;
    try {
        astReal = JSON.parse(fs.readFileSync(astPath, 'utf8'));
    } catch (e) {
        console.error(`[ERROR] No se pudo leer el AST en ${astPath}`);
        return;
    }

    // 2. Cargar XHTML Real
    const xhtmlPath = path.join(__dirname, '../salidaXHTML/fragmento.xhtml');
    let domTree = { tag: 'body', contenido: [] };
    try {
        const rawXHTML = fs.readFileSync(xhtmlPath, 'utf8');
        const dom = new JSDOM(rawXHTML);
        const document = dom.window.document;
        
        const nodosRaiz = document.querySelectorAll('body > p, body > h1, body > h2, body > h3, body > div');
        nodosRaiz.forEach((nodo) => {
            domTree.contenido.push({
                tag: nodo.tagName.toLowerCase(),
                classes: Array.from(nodo.classList),
                texto: nodo.textContent
            });
        });
    } catch (e) {
        console.error(`[ERROR] No se pudo leer el XHTML en ${xhtmlPath}`);
        return;
    }

    // 3. Canonización
    const astCanonical = ASTCanonicalizer.canonicalize(astReal);
    const domCanonical = DOMCanonicalizer.canonicalize(domTree);

    console.log(`[INFO] Nodos AST canónicos: ${astCanonical.nodes.length}`);
    console.log(`[INFO] Nodos DOM canónicos: ${domCanonical.nodes.length}`);

    // 4. Extracción de Anclajes (Intradiádica e Independiente)
    const astExtraction = StructuralAnchorExtractor.extract(astCanonical);
    const domExtraction = StructuralAnchorExtractor.extract(domCanonical);

    console.log(`[INFO] Anclajes detectados en AST: ${astExtraction.anchors.length}`);
    console.log(`[INFO] Anclajes detectados en DOM: ${domExtraction.anchors.length}\n`);

    // 5. Alineación Topológica por Anclajes
    const alignmentMap = AnchorAlignmentEngine.align(astCanonical, domCanonical, astExtraction, domExtraction);

    // 6. Reporte Ejecutivo
    console.log('📊 RESUMEN DE ALINEACIÓN (ANCHOR-BASED):');
    console.table([alignmentMap.summary]);

    console.log('\n🔍 MUESTRA DE CASOS ESTRUCTURALES DETECTADOS:');
    const estructurales = alignmentMap.alignments.filter(a => a.status !== 'ALIGN.MATCH');

    if (estructurales.length === 0) {
        console.log('  Ninguno. Coincidencia topológica exacta.');
    } else {
        estructurales.slice(0, 15).forEach((a, index) => {
            console.log(`----------------------------------------------------`);
            console.log(`[CASO #${index + 1}] Estado: ${a.status} | Evidencia: ${a.evidence.anchorType}`);
            console.log(`AST Range: [${a.astRange.join(', ')}]`);
            if (a.astRange.length > 0 && a.astRange[0] !== undefined) {
                for(let k = a.astRange[0]; k <= a.astRange[1] && k < astCanonical.nodes.length; k++) {
                    const txt = astCanonical.nodes[k].normalizedText;
                    console.log(`   AST[${k}]: "${txt.length > 60 ? txt.substring(0, 60) + '...' : txt}"`);
                }
            }
            
            console.log(`DOM Range: [${a.domRange.join(', ')}]`);
            if (a.domRange.length > 0 && a.domRange[0] !== undefined) {
                for(let k = a.domRange[0]; k <= a.domRange[1] && k < domCanonical.nodes.length; k++) {
                    const txt = domCanonical.nodes[k].normalizedText;
                    console.log(`   DOM[${k}]: "${txt.length > 60 ? txt.substring(0, 60) + '...' : txt}"`);
                }
            }
        });
        if (estructurales.length > 15) {
            console.log(`... y ${estructurales.length - 15} casos adicionales estructurales detectados.`);
        }
    }
    console.log('\n====================================================\n');
}

ejecutarAuditoriaEmpirica();