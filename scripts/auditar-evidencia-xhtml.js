/**
 * E19.4-A — Auditoría de Evidencia Física XHTML (Cadena de Custodia)
 * Extrae y preserva la evidencia cruda del XHTML usando JSDOM, canoniza, 
 * reconcilia, clasifica pasivamente e imprime el reporte físico.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom'); // Dependencia nativa del proyecto (package.json)

// Módulos de la arquitectura congelada
const ASTCanonicalizer = require('../src/validadores/E18/ASTCanonicalizer');
const DOMCanonicalizer = require('../src/validadores/E18/DOMCanonicalizer');
const CanonicalReconciler = require('../src/validadores/E18/CanonicalReconciler');
const TextDiscrepancyClassifier = require('../src/validadores/E19/TextDiscrepancyClassifier');

function ejecutarAuditoria() {
    console.log('====================================================');
    console.log('  🔍 E19.4-A: EXTRACCIÓN DE EVIDENCIA FÍSICA Y CANÓNICA');
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
    let rawXHTML = '';
    try {
        rawXHTML = fs.readFileSync(xhtmlPath, 'utf8');
    } catch (e) {
        console.error(`[ERROR] No se pudo leer el XHTML en ${xhtmlPath}`);
        return;
    }

    // 3. PARSE FORENSE (Capa B: Evidencia Física)
    const dom = new JSDOM(rawXHTML);
    const document = dom.window.document;
    
    // Objeto genérico para el DOMCanonicalizer (Capa A)
    const domTree = { tag: 'body', contenido: [] };
    
    // Array paralelo para conservar la cadena de custodia física
    // Inyectamos un objeto para el <body> (Índice 0) para alinear con DOMCanonicalizer
    const evidenciaFisica = [{
        outerHTML: '<body>...</body>',
        innerHTML: rawXHTML,
        textContent: document.body.textContent
    }];

    // Seleccionamos los nodos principales dentro del body
    const nodosRaiz = document.querySelectorAll('body > p, body > h1, body > h2, body > h3, body > div');

    nodosRaiz.forEach((nodo) => {
        // --- CAPA B: PRESERVACIÓN FÍSICA (Índices 1 en adelante) ---
        evidenciaFisica.push({
            outerHTML: nodo.outerHTML,
            innerHTML: nodo.innerHTML,
            textContent: nodo.textContent
        });
// ... resto del script igual ...

        // --- CAPA A: ADAPTACIÓN PARA EL CANONICALIZER ---
        domTree.contenido.push({
            tag: nodo.tagName.toLowerCase(),
            classes: Array.from(nodo.classList),
            texto: nodo.textContent // El DOM extrae el texto puro, tal cual lo haría el e-reader
        });
    });

    // 4. CANONIZACIÓN
    const astCanonical = ASTCanonicalizer.canonicalize(astReal);
    const domCanonical = DOMCanonicalizer.canonicalize(domTree);

    // 5. RECONCILIACIÓN
    const reporte = CanonicalReconciler.reconcile(astCanonical, domCanonical);

    // 6. AISLAMIENTO DE MISMATCHES TEXTUALES
    const discrepancias = reporte.nodes.filter(n => n.comparison.text === 'MISMATCH');

    console.log(`[INFO] Nodos físicos extraídos: ${evidenciaFisica.length}`);
    console.log(`[INFO] Discrepancias textuales a investigar: ${discrepancias.length}\n`);

    // 7. INFORME FORENSE DETALLADO
    discrepancias.forEach((nodoReconciliado, count) => {
        // En MATCHING.POSITIONAL, el index nos permite recuperar la evidencia física exacta
        const phys = evidenciaFisica[nodoReconciliado.index];
        
        // Invocamos a E19.3 pasivamente
        const pair = { ast: nodoReconciliado.ast, dom: nodoReconciliado.dom };
        const clasificacion = TextDiscrepancyClassifier.classify(pair);
        
        const num = String(count + 1).padStart(3, '0');
        console.log(`----------------------------------------------------`);
        console.log(`MISMATCH #${num} | Index Global: ${nodoReconciliado.index}`);
        console.log(`Clasificación E19.3: [TEXT: ${clasificacion.text}] [FINGERPRINT: ${clasificacion.fingerprint}] [EDITORIAL: ${clasificacion.editorialEquivalence}]`);
        console.log(`semanticType : ${pair.ast.semanticType}`);
        console.log(`nodeKind     : ${pair.ast.nodeKind}\n`);

        console.log(`[AST Canonical Text]`);
        console.log(`"${pair.ast.normalizedText}"\n`);

        console.log(`[DOM Canonical Text]`);
        console.log(`"${pair.dom.normalizedText}"\n`);

        console.log(`[AST Fingerprint] : ${pair.ast.contentFingerprint}`);
        console.log(`[DOM Fingerprint] : ${pair.dom.contentFingerprint}\n`);

        console.log(`[DOM Raw outerHTML] (Evidencia Física E19.4-A)`);
        console.log(phys.outerHTML);
        console.log();
    });

    console.log(`====================================================`);
    console.log(`  FIN DEL INFORME (Total: ${discrepancias.length} expedientes físicos)`);
    console.log(`====================================================\n`);
}

ejecutarAuditoria();