/**
 * E19.5.1 — Clasificador Empírico de Discrepancias Textuales (TextDiscrepancyClassifier)
 * Procesa los 51 TEXT.MISMATCH certificados del baseline E19.4,
 * colaciona los rangos topológicos y tipifica la divergencia física sin corrección editorial.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Módulos certificados de la arquitectura congelada E18
const ASTCanonicalizer = require('../src/validadores/E18/ASTCanonicalizer');
const DOMCanonicalizer = require('../src/validadores/E18/DOMCanonicalizer');
const StructuralAnchorExtractor = require('../src/validadores/E18/StructuralAnchorExtractor');
const AnchorAlignmentEngine = require('../src/validadores/E18/AnchorAlignmentEngine');
const RangeAwareReconciler = require('../src/validadores/E18/RangeAwareReconciler');
const RangeTextCollator = require('../src/validadores/E18/RangeTextCollator');

/**
 * Clasifica la discrepancia textual entre el texto AST colacionado y el texto DOM colacionado.
 * @param {string} astText 
 * @param {string} domText 
 * @returns {Object} Clasificación y nivel de confianza
 */
function classifyTextDiscrepancy(astText, domText) {
    if (!astText || !domText) {
        return { type: 'UNKNOWN', confidence: 'LOW', details: 'Texto ausente en uno de los lados' };
    }

    // 1. Limpieza de espacios para verificar si la diferencia es puramente de espacios colapsados (ej. InDesign word-join)
    const astNormalizedWhitespace = astText.replace(/\s+/g, '');
    const domNormalizedWhitespace = domText.replace(/\s+/g, '');

    if (astNormalizedWhitespace === domNormalizedWhitespace) {
        return { 
            type: 'WHITESPACE_VARIATION', 
            confidence: 'HIGH', 
            details: 'Diferencia exclusiva en espacios o saltos colapsados (ej. palabras unidas)' 
        };
    }

    // 2. Verificar diferencias de longitud menores por signos de puntuación o tildes (TYPOGRAPHIC_NORMALIZATION)
    if (Math.abs(astText.length - domText.length) <= 3) {
        return { 
            type: 'TYPOGRAPHIC_NORMALIZATION', 
            confidence: 'MEDIUM', 
            details: 'Variación menor de caracteres (posible puntuación, comillas o tildes)' 
        };
    }

    // 3. Verificar si uno contiene al otro (CONTENT_ADDITION / CONTENT_DELETION parcial)
    if (astText.includes(domText) || domText.includes(astText)) {
        return { 
            type: 'CONTENT_VARIATION_SUBSET', 
            confidence: 'MEDIUM', 
            details: 'Uno de los textos es un subconjunto del otro (posible pérdida de fragmento en exportación)' 
        };
    }

    // 4. Por defecto, variación general de caracteres o contenido
    return { 
        type: 'CHARACTER_OR_CONTENT_SUBSTITUTION', 
        confidence: 'LOW', 
        details: 'Diferencia estructural compleja en el cuerpo del texto' 
    };
}

function ejecutarClasificacionE19() {
    console.log('====================================================');
    console.log('  🔍 E19.5.1: CLASIFICACIÓN EMPÍRICA DE DISCREPANCIAS');
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

    // 3. Aislar los TEXT.MISMATCH
    const mismatches = reconciliationReport.reconciliations.filter(r => r.text && r.text.status === 'TEXT.MISMATCH');

    const taxonomyCounts = {};
    const expedientes = [];

    mismatches.forEach((rec, idx) => {
        // Extraer texto colacionado real según la topología
        let astCollatedText = '';
        let domCollatedText = '';

        try {
            if (rec.status === 'ALIGN.MERGE' || rec.status === 'ALIGN.SPLIT' || rec.status === 'ALIGN.MATCH') {
                const astRes = RangeTextCollator.collate(astCanonical, rec.astRange);
                const domRes = RangeTextCollator.collate(domCanonical, rec.domRange);
                astCollatedText = astRes.collatedText;
                domCollatedText = domRes.collatedText;
            }
        } catch (e) {
            astCollatedText = '[Error de colación]';
            domCollatedText = '[Error de colación]';
        }

        const classification = classifyTextDiscrepancy(astCollatedText, domCollatedText);

        taxonomyCounts[classification.type] = (taxonomyCounts[classification.type] || 0) + 1;

        expedientes.push({
            mismatchIndex: idx + 1,
            topology: rec.status,
            astRange: rec.astRange,
            domRange: rec.domRange,
            astText: astCollatedText,
            domText: domCollatedText,
            classification,
            editorialEquivalence: 'NOT_DEMONSTRATED'
        });
    });

    console.log('📊 RESUMEN TAXONÓMICO DE LOS MISMATCHES (E19.5):');
    console.table([taxonomyCounts]);

    console.log('\n----------------------------------------------------');
    console.log('  MUESTRA DE EXPEDIENTES CLASIFICADOS (PRIMEROS 5)');
    console.log('----------------------------------------------------');

    expedientes.slice(0, 5).forEach((exp) => {
        console.log(`\n[EXPEDIENTE #${exp.mismatchIndex}] Topología: ${exp.topology}`);
        console.log(`  AST Range: [${exp.astRange.join(', ')}] | DOM Range: [${exp.domRange.join(', ')}]`);
        console.log(`  Clasificación: ${exp.classification.type} (${exp.classification.confidence})`);
        console.log(`  Detalle: ${exp.classification.details}`);
        console.log(`  AST Collation: "${exp.astText.length > 60 ? exp.astText.substring(0, 60) + '...' : exp.astText}"`);
        console.log(`  DOM Collation: "${exp.domText.length > 60 ? exp.domText.substring(0, 60) + '...' : exp.domText}"`);
        console.log(`  Equivalencia Editorial: ${exp.editorialEquivalence}`);
    });

    // Opcional: Guardar reporte detallado en JSON para análisis posterior
    const reportPath = path.join(__dirname, '../salidaXHTML/e19-classification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(expedientes, null, 2), 'utf8');
    console.log(`\n📁 Expediente completo guardado en: ${reportPath}`);

    console.log('\n====================================================');
    console.log('  FIN DE LA CLASIFICACIÓN EMPÍRICA E19.5');
    console.log('====================================================\n');
}

ejecutarClasificacionE19();