/**
 * E19.4 — Auditoría Forense de Discrepancias Textuales
 * Aísla y reporta los casos de TEXT.MISMATCH detectados en el corpus real,
 * utilizando TextDiscrepancyClassifier para certificar el estado, 
 * sin aplicar heurísticas de equivalencia editorial.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Importación de la arquitectura congelada
const ASTCanonicalizer = require('../src/validadores/E18/ASTCanonicalizer');
const DOMCanonicalizer = require('../src/validadores/E18/DOMCanonicalizer');
const CanonicalReconciler = require('../src/validadores/E18/CanonicalReconciler');
const TextDiscrepancyClassifier = require('../src/validadores/E19/TextDiscrepancyClassifier');

function ejecutarAuditoriaForense() {
    console.log('====================================================');
    console.log('  🔍 E19.4 - INVENTARIO FÍSICO DE DISCREPANCIAS TEXTUALES');
    console.log('====================================================\n');

    // 1. Cargar AST Real (InDesign JSON)
    const astPath = path.join(__dirname, '../salidaXHTML/fragmento.json');
    let astReal = null;
    try {
        astReal = JSON.parse(fs.readFileSync(astPath, 'utf8'));
    } catch (e) {
        console.error(`[ERROR] No se pudo leer el AST en ${astPath}`);
        return;
    }

    // 2. Cargar XHTML Real y adaptar a DOM Object
    const xhtmlPath = path.join(__dirname, '../salidaXHTML/fragmento.xhtml');
    let domTree = { tag: 'body', contenido: [] };
    try {
        const rawXHTML = fs.readFileSync(xhtmlPath, 'utf8');
        const regexElementos = /<([a-z0-9-]+)([^>]*)>(.*?)<\/\1>/gi;
        let match;
        
        while ((match = regexElementos.exec(rawXHTML)) !== null) {
            const tag = match[1].toLowerCase();
            if (['p', 'h1', 'h2', 'h3', 'h4', 'div'].includes(tag)) {
                const atributosStr = match[2];
                const innerHTML = match[3];
                
                let classes = [];
                const classMatch = atributosStr.match(/class=["']([^"']+)["']/i);
                if (classMatch) classes = classMatch[1].split(/\s+/).filter(Boolean);
                
                // Extracción cruda (solo se limpian los tags HTML, el texto queda intacto)
                const textoLimpio = innerHTML.replace(/<[^>]+>/g, '').trim();

                domTree.contenido.push({ tag, classes, texto: textoLimpio });
            }
        }
    } catch (e) {
        console.error(`[ERROR] No se pudo leer el XHTML en ${xhtmlPath}`);
        return;
    }

    // 3. Canonización Independiente
    const astCanonical = ASTCanonicalizer.canonicalize(astReal);
    const domCanonical = DOMCanonicalizer.canonicalize(domTree);

    // 4. Reconciliación
    const reporte = CanonicalReconciler.reconcile(astCanonical, domCanonical);

    // 5. Extracción y Clasificación de Mismatches
    const discrepancias = reporte.nodes.filter(n => n.comparison.text === 'MISMATCH');

    console.log(`[INFO] Se detectaron ${discrepancias.length} discrepancias textuales.`);
    console.log('Generando reporte físico detallado...\n');

    discrepancias.forEach((nodoReconciliado, index) => {
        // Formamos el par inmutable para el clasificador E19
        const pair = { ast: nodoReconciliado.ast, dom: nodoReconciliado.dom };
        
        // El clasificador certifica que, en efecto, es un MISMATCH y NOT_DEMONSTRATED
        const clasificacion = TextDiscrepancyClassifier.classify(pair);

        const num = String(index + 1).padStart(3, '0');
        console.log(`----------------------------------------------------`);
        console.log(`MISMATCH #${num} | Index: ${nodoReconciliado.index} | Tipo: ${pair.ast.semanticType} | Kind: ${pair.ast.nodeKind}`);
        console.log(`Estado Textual : ${clasificacion.text}`);
        console.log(`Estado Huella  : ${clasificacion.fingerprint}`);
        console.log(`Equivalencia   : ${clasificacion.editorialEquivalence}`);
        console.log(`[AST] Texto    : "${pair.ast.normalizedText}"`);
        console.log(`[DOM] Texto    : "${pair.dom.normalizedText}"`);
        console.log(`[AST] Hash     : ${pair.ast.contentFingerprint}`);
        console.log(`[DOM] Hash     : ${pair.dom.contentFingerprint}`);
    });

    console.log(`\n====================================================`);
    console.log(`  FIN DEL REPORTE (Total: ${discrepancias.length} casos documentados)`);
    console.log(`====================================================\n`);
}

ejecutarAuditoriaForense();