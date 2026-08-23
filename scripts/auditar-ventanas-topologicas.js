/**
 * E18.2.5.4 — Auditoría Empírica Ventana por Ventana (Windowed Audit Report)
 * Orquesta la canalización completa (Extracción de Anclajes → Alineación → Resolución de Fronteras)
 * sobre el corpus real, produciendo un inventario físico exhaustivo y métricas de cobertura.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Módulos congelados y certificados de la arquitectura
const ASTCanonicalizer = require('../src/validadores/E18/ASTCanonicalizer');
const DOMCanonicalizer = require('../src/validadores/E18/DOMCanonicalizer');
const StructuralAnchorExtractor = require('../src/validadores/E18/StructuralAnchorExtractor');
const AnchorAlignmentEngine = require('../src/validadores/E18/AnchorAlignmentEngine');
const WindowBoundaryResolver = require('../src/validadores/E18/WindowBoundaryResolver');

function ejecutarAuditoriaVentanas() {
    console.log('====================================================');
    console.log('  🔍 E18.2.5.4: AUDITORÍA EMPÍRICA VENTANA POR VENTANA');
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

    // 2. Cargar XHTML Real y parsear con JSDOM
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

    // 4. Extracción Independiente de Anclajes
    const astExtraction = StructuralAnchorExtractor.extract(astCanonical);
    const domExtraction = StructuralAnchorExtractor.extract(domCanonical);

    // 5. Alineación por Anclajes (AnchorAlignmentEngine)
    const alignmentMap = AnchorAlignmentEngine.align(astCanonical, domCanonical, astExtraction, domExtraction);

    // 6. Resolución de Fronteras Topológicas (WindowBoundaryResolver)
    const windowMap = WindowBoundaryResolver.resolve(astCanonical, domCanonical, astExtraction.anchors, domExtraction.anchors);

    // 7. Cálculo de Cobertura Topológica y Métricas
    const totalAstNodes = astCanonical.nodes.length;
    const totalDomNodes = domCanonical.nodes.length;

    let astCoveredNodes = new Set();
    let domCoveredNodes = new Set();

    windowMap.windows.forEach(w => {
        if (w.astRange && w.astRange.length === 2) {
            for (let k = w.astRange[0]; k <= w.astRange[1]; k++) astCoveredNodes.add(k);
        }
        if (w.domRange && w.domRange.length === 2) {
            for (let k = w.domRange[0]; k <= w.domRange[1]; k++) domCoveredNodes.add(k);
        }
    });

    if (windowMap.preAnchorRegion) {
        if (windowMap.preAnchorRegion.astRange && windowMap.preAnchorRegion.astRange.length === 2) {
            for (let k = windowMap.preAnchorRegion.astRange[0]; k <= windowMap.preAnchorRegion.astRange[1]; k++) astCoveredNodes.add(k);
        }
        if (windowMap.preAnchorRegion.domRange && windowMap.preAnchorRegion.domRange.length === 2) {
            for (let k = windowMap.preAnchorRegion.domRange[0]; k <= windowMap.preAnchorRegion.domRange[1]; k++) domCoveredNodes.add(k);
        }
    }

    if (windowMap.postAnchorRegion) {
        if (windowMap.postAnchorRegion.astRange && windowMap.postAnchorRegion.astRange.length === 2) {
            for (let k = windowMap.postAnchorRegion.astRange[0]; k <= windowMap.postAnchorRegion.astRange[1]; k++) astCoveredNodes.add(k);
        }
        if (windowMap.postAnchorRegion.domRange && windowMap.postAnchorRegion.domRange.length === 2) {
            for (let k = windowMap.postAnchorRegion.domRange[0]; k <= windowMap.postAnchorRegion.domRange[1]; k++) domCoveredNodes.add(k);
        }
    }

    const metrics = {
        totalWindows: windowMap.windows.length,
        matches: alignmentMap.summary.matches,
        merges: alignmentMap.summary.merges,
        splits: alignmentMap.summary.splits,
        ambiguous: alignmentMap.summary.ambiguous,
        astAnchors: astExtraction.anchors.length,
        domAnchors: domExtraction.anchors.length,
        astCoverage: ((astCoveredNodes.size / totalAstNodes) * 100).toFixed(2) + '%',
        domCoverage: ((domCoveredNodes.size / totalDomNodes) * 100).toFixed(2) + '%',
        monotonicity: windowMap.monotonicityViolated ? 'VIOLADA ⚠️' : 'CONSERVADA ✅'
    };

    // 8. Impresión del Inventario Forense
    console.log('📊 MÉTRICAS GLOBALES DE COBERTURA TOPOLÓGICA:');
    console.table([metrics]);

    console.log('\n----------------------------------------------------');
    console.log('  INVENTARIO FÍSICO DE VENTANAS TOPOLÓGICAS');
    console.log('----------------------------------------------------');

    if (windowMap.preAnchorRegion && (windowMap.preAnchorRegion.astRange.length > 0 || windowMap.preAnchorRegion.domRange.length > 0)) {
        console.log(`\n[REGIÓN PRE-ANCLA]`);
        console.log(`  AST Range: [${windowMap.preAnchorRegion.astRange.join(', ')}]`);
        console.log(`  DOM Range: [${windowMap.preAnchorRegion.domRange.join(', ')}]`);
    }

    windowMap.windows.forEach((win, index) => {
        const num = String(index + 1).padStart(3, '0');
        console.log(`\nWINDOW #${num} | Anchor Key: "${win.anchorKey}" | Status: ${win.status}`);
        console.log(`  AST range: [${win.astRange.join(', ') || 'VACÍO'}]`);
        console.log(`  DOM range: [${win.domRange.join(', ') || 'VACÍO'}]`);

        // Muestra de snippets físicos (pertenencia topológica, no equivalencia semántica)
        if (win.astRange && win.astRange.length === 2) {
            console.log(`  --- AST Content Snippets ---`);
            for (let k = win.astRange[0]; k <= win.astRange[1] && k < astCanonical.nodes.length; k++) {
                const txt = astCanonical.nodes[k].normalizedText;
                console.log(`    AST[${k}]: "${txt.length > 55 ? txt.substring(0, 55) + '...' : txt}"`);
            }
        }

        if (win.domRange && win.domRange.length === 2) {
            console.log(`  --- DOM Content Snippets ---`);
            for (let k = win.domRange[0]; k <= win.domRange[1] && k < domCanonical.nodes.length; k++) {
                const txt = domCanonical.nodes[k].normalizedText;
                console.log(`    DOM[${k}]: "${txt.length > 55 ? txt.substring(0, 55) + '...' : txt}"`);
            }
        }
    });

    if (windowMap.postAnchorRegion && (windowMap.postAnchorRegion.astRange.length > 0 || windowMap.postAnchorRegion.domRange.length > 0)) {
        console.log(`\n[REGIÓN POST-ANCLA]`);
        console.log(`  AST Range: [${windowMap.postAnchorRegion.astRange.join(', ')}]`);
        console.log(`  DOM Range: [${windowMap.postAnchorRegion.domRange.join(', ')}]`);
    }

    console.log('\n====================================================');
    console.log('  FIN DEL REPORTE DE AUDITORÍA TOPOLÓGICA');
    console.log('====================================================\n');
}

ejecutarAuditoriaVentanas();