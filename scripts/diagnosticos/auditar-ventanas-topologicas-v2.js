/**
 * E18.2.5.4-B — Auditoría Empírica Ventana por Ventana (v2)
 * Re-ejecuta la canalización topológica completa sobre el corpus real 
 * bajo la semántica de rangos de cursores certificada.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Módulos congelados de la arquitectura
const ASTCanonicalizer = require('../src/validadores/E18/ASTCanonicalizer');
const DOMCanonicalizer = require('../src/validadores/E18/DOMCanonicalizer');
const StructuralAnchorExtractor = require('../src/validadores/E18/StructuralAnchorExtractor');
const AnchorAlignmentEngine = require('../src/validadores/E18/AnchorAlignmentEngine');
const WindowBoundaryResolver = require('../src/validadores/E18/WindowBoundaryResolver');

function ejecutarAuditoriaV2() {
    console.log('====================================================');
    console.log('  🔍 E18.2.5.4-B: AUDITORÍA EMPÍRICA VENTANA POR VENTANA (v2)');
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

    // 4. Extracción de Anclajes
    const astExtraction = StructuralAnchorExtractor.extract(astCanonical);
    const domExtraction = StructuralAnchorExtractor.extract(domCanonical);

    // 5. Alineación por Anclajes
    const alignmentMap = AnchorAlignmentEngine.align(astCanonical, domCanonical, astExtraction, domExtraction);

    // 6. Resolución de Fronteras Topológicas
    const windowMap = WindowBoundaryResolver.resolve(astCanonical, domCanonical, astExtraction.anchors, domExtraction.anchors);

    // 7. Cálculo de Cobertura y Métricas V2
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

    // Conteo de ventanas de tipo un-matched (huérfanos reportados por el resolver)
    const unmatchedWindows = windowMap.windows.filter(w => w.status === 'WINDOW.UNMATCHED').length;

    const metricsV2 = {
        totalWindows: windowMap.windows.length,
        matches: alignmentMap.summary.matches,
        merges: alignmentMap.summary.merges,
        splits: alignmentMap.summary.splits,
        unmatchedWindows: unmatchedWindows,
        astAnchors: astExtraction.anchors.length,
        domAnchors: domExtraction.anchors.length,
        astCoverage: ((astCoveredNodes.size / totalAstNodes) * 100).toFixed(2) + '%',
        domCoverage: ((domCoveredNodes.size / totalDomNodes) * 100).toFixed(2) + '%',
        monotonicity: windowMap.monotonicityViolated ? 'VIOLADA ⚠️' : 'CONSERVADA ✅'
    };

    console.log('📊 MÉTRICAS GLOBALES DE COBERTURA TOPOLÓGICA (V2):');
    console.table([metricsV2]);

    console.log('\n----------------------------------------------------');
    console.log('  INVENTARIO RESUMIDO DE VENTANAS TOPOLÓGICAS (V2)');
    console.log('----------------------------------------------------');

    windowMap.windows.slice(0, 15).forEach((win, index) => {
        const num = String(index + 1).padStart(3, '0');
        console.log(`\nWINDOW #${num} | Anchor Key: "${win.anchorKey}" | Status: ${win.status}`);
        console.log(`  AST range: [${win.astRange.join(', ') || 'VACÍO'}]`);
        console.log(`  DOM range: [${win.domRange.join(', ') || 'VACÍO'}]`);
    });

    if (windowMap.windows.length > 15) {
        console.log(`\n... [Se omiten ${windowMap.windows.length - 15} ventanas adicionales en este resumen, inventario completo registrado].`);
    }

    console.log('\n====================================================');
    console.log('  FIN DE LA AUDITORÍA V2');
    console.log('====================================================\n');
}

ejecutarAuditoriaV2();