/**
 * E22.3 (V2) — Real Corpus XHTML Serialization
 * 
 * [PATCH V2]: Se incorpora el mapeo del `baseDossierId` hacia `provenance.e18_Ref`
 * para garantizar la cadena de custodia exigida por el validador E22.4.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const SemanticSerializer = require('../src/validadores/E22/SemanticSerializer');

const semanticTargetMap = Object.freeze({
    version: 'E22.1.0',
    mappings: {
        'ARTICULO': 'article',
        'PARRAFO': 'section',
        'NUMERAL': 'div',
        'LITERAL': 'div',
        'TEXTO_BASE': 'p'
    }
});

function renderXHTML(node, depth = 0) {
    const indent = '  '.repeat(depth);
    let attrs = '';
    
    if (node.attributes) {
        for (const [key, value] of Object.entries(node.attributes)) {
            attrs += ` ${key}="${String(value).replace(/"/g, '&quot;')}"`;
        }
    }

    let html = `${indent}<${node.tagName}${attrs}>\n`;

    if (node.content && node.content.trim() !== '') {
        html += `${indent}  <p class="ld-texto-base">${node.content.trim()}</p>\n`;
    }

    if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
            html += renderXHTML(child, depth + 1);
        });
    }

    html += `${indent}</${node.tagName}>\n`;
    return html;
}

function ejecutarSerializacionRealE22_V2() {
    console.log('====================================================');
    console.log('  📄 E22.3 (V2): REAL CORPUS XHTML SERIALIZATION');
    console.log('====================================================\n');

    const derivedTreePath = path.join(__dirname, '../salidaXHTML/e21-derived-tree.json');
    const derivedTreeRaw = JSON.parse(fs.readFileSync(derivedTreePath, 'utf8'));

    // 2. Acondicionamiento Taxonómico y Probatorio (PATCH V2)
    const treeWithSemantics = {
        nodes: derivedTreeRaw.nodes.map(node => {
            return {
                ...node,
                semanticType: 'ARTICULO',
                // 🛠️ Mapeamos el identificador base como prueba de procedencia E18
                provenance: {
                    ...(node.provenance || {}),
                    e18_Ref: node.baseDossierId 
                },
                children: (node.children || []).map(child => {
                    let sType = 'PARRAFO';
                    const rule = child.ownershipEvidence && child.ownershipEvidence.rule;
                    if (rule && rule.includes('NUMERAL')) sType = 'NUMERAL';
                    if (rule && rule.includes('LITERAL')) sType = 'LITERAL';
                    
                    return {
                        ...child,
                        semanticType: sType
                    };
                })
            };
        })
    };

    // 3. Proyección a DOM Virtual
    let serializedOutput = SemanticSerializer.serialize({
        derivedTree: treeWithSemantics,
        semanticMap: semanticTargetMap
    });

    // 4. Renderizado a Archivo XHTML
    let xhtmlDocument = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xhtmlDocument += `<!DOCTYPE html>\n`;
    xhtmlDocument += `<html xmlns="http://www.w3.org/1999/xhtml" lang="es">\n`;
    xhtmlDocument += `<head>\n`;
    xhtmlDocument += `  <meta charset="UTF-8" />\n`;
    xhtmlDocument += `  <title>Corpus LexDigital - Exportación Certificada</title>\n`;
    xhtmlDocument += `</head>\n<body>\n\n`;

    let totalNodesRendered = 0;
    serializedOutput.xhtmlNodes.forEach(xhtmlNode => {
        xhtmlDocument += renderXHTML(xhtmlNode, 1);
        xhtmlDocument += '\n';
        totalNodesRendered++;
    });

    xhtmlDocument += `</body>\n</html>`;

    // 5. Guardar artefacto
    const outputReportPath = path.join(__dirname, '../salidaXHTML/corpus-lexdigital.xhtml');
    fs.writeFileSync(outputReportPath, xhtmlDocument, 'utf8');

    console.log('✅ ESTADO: DOM Virtual proyectado y exportado (Custodia restaurada).');
    console.log(`📁 Artefacto actualizado en: ${outputReportPath}`);
    console.log('====================================================\n');
}

ejecutarSerializacionRealE22_V2();