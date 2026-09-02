/**
 * E18.2.4.4 — Auditoría de Integración AST Real ↔ XHTML Real
 * Lee los archivos de producción, canoniza independientemente y reconcilia.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Importación de módulos congelados
const ASTCanonicalizer = require('../src/validadores/E18/ASTCanonicalizer');
const DOMCanonicalizer = require('../src/validadores/E18/DOMCanonicalizer');
const CanonicalReconciler = require('../src/validadores/E18/CanonicalReconciler');

function ejecutarAuditoria() {
    console.log('====================================================');
    console.log('  🔍 INICIANDO RECONCILIACIÓN CANÓNICA (PRODUCCIÓN)');
    console.log('====================================================\n');

    // 1. Cargar AST Real (InDesign JSON)
    const astPath = path.join(__dirname, '../salidaXHTML/fragmento.json'); // Ajusta la ruta si es necesario
    let astReal = null;
    try {
        const rawAST = fs.readFileSync(astPath, 'utf8');
        astReal = JSON.parse(rawAST);
        console.log(`[OK] AST cargado: ${astReal.totalParrafos} párrafos detectados.`);
    } catch (e) {
        console.error(`[ERROR] No se pudo leer el AST en ${astPath}`);
        return;
    }

    // 2. Cargar XHTML Real y adaptar a DOM Object
    const xhtmlPath = path.join(__dirname, '../salidaXHTML/fragmento.xhtml');
    let domTree = { tag: 'body', contenido: [] };
    try {
        const rawXHTML = fs.readFileSync(xhtmlPath, 'utf8');
        // Adaptador simple para extraer etiquetas relevantes del XHTML real
        const regexElementos = /<([a-z0-9-]+)([^>]*)>(.*?)<\/\1>/gi;
        let match;
        
        while ((match = regexElementos.exec(rawXHTML)) !== null) {
            const tag = match[1].toLowerCase();
            if (['p', 'h1', 'h2', 'h3', 'h4', 'div'].includes(tag)) {
                const atributosStr = match[2];
                const innerHTML = match[3];
                
                // Extraer clases
                let classes = [];
                const classMatch = atributosStr.match(/class=["']([^"']+)["']/i);
                if (classMatch) {
                    classes = classMatch[1].split(/\s+/).filter(Boolean);
                }
                
                // Limpiar texto (remover tags internos como <span>)
                const textoLimpio = innerHTML.replace(/<[^>]+>/g, '').trim();

                domTree.contenido.push({
                    tag,
                    classes,
                    texto: textoLimpio
                });
            }
        }
        console.log(`[OK] XHTML cargado y adaptado: ${domTree.contenido.length} nodos raíz detectados.`);
    } catch (e) {
        console.error(`[ERROR] No se pudo leer el XHTML en ${xhtmlPath}`);
        return;
    }

    // 3. Canonización Independiente (Vectores Paralelos)
    console.log('\n[INFO] Ejecutando Canonicalizers...');
    const astCanonical = ASTCanonicalizer.canonicalize(astReal);
    const domCanonical = DOMCanonicalizer.canonicalize(domTree);

    console.log(`  -> AST Canonical Nodes: ${astCanonical.nodes.length}`);
    console.log(`  -> DOM Canonical Nodes: ${domCanonical.nodes.length}`);

    // 4. Reconciliación Forense
    console.log('\n[INFO] Ejecutando CanonicalReconciler...');
    const reporte = CanonicalReconciler.reconcile(astCanonical, domCanonical);

    // 5. Impresión del Reporte
    console.log('\n====================================================');
    console.log('  📊 REPORTE DE RECONCILIACIÓN FORENSE');
    console.log('====================================================');
    console.log(`- Estrategia de emparejamiento : ${reporte.matching.strategy}`);
    console.log(`- Nodos emparejados (Matches)  : ${reporte.matching.matchedNodes}`);
    console.log(`- Nodos AST sin pareja         : ${reporte.matching.unmatchedAstNodes}`);
    console.log(`- Nodos DOM sin pareja         : ${reporte.matching.unmatchedDomNodes}`);
    
    console.log('\n--- VECTORES DE COINCIDENCIA ---');
    console.log(`- Semántica (semanticType)     : ${reporte.summary.semanticMatches} Matches | ${reporte.summary.semanticMismatches} Mismatches`);
    console.log(`- Tipo de Nodo (nodeKind)      : ${reporte.summary.nodeKindMatches} Matches | ${reporte.summary.nodeKindMismatches} Mismatches`);
    console.log(`- Texto Normalizado            : ${reporte.summary.textMatches} Matches | ${reporte.summary.textMismatches} Mismatches`);
    console.log(`- Huella (contentFingerprint)  : ${reporte.summary.fingerprintMatches} Matches | ${reporte.summary.fingerprintMismatches} Mismatches`);
    
    console.log('\n--- VECTORES DE IDENTIDAD Y ESTRUCTURA ---');
    console.log(`- Identidad (Matches)          : ${reporte.summary.identityMatches}`);
    console.log(`- Identidad (DOM_ABSENT)       : ${reporte.summary.identityAbsent}`);
    console.log(`- Identidad (Mismatches)       : ${reporte.summary.identityMismatches}`);
    console.log('====================================================\n');
}

ejecutarAuditoria();