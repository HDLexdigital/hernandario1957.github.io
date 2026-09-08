/**
 * E23.3.2 (V2) — Real Corpus Projection Plan Generator
 * 
 * [PATCH V2]: Se incorpora el paso de condicionamiento taxonómico para asignar
 * correctamente el `semanticType` (ARTICULO, PARRAFO, NUMERAL, LITERAL) a partir
 * del Árbol Derivado de E21 antes de proyectar.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const ProjectionAdapter = require('../src/validadores/E23/ProjectionAdapter');

function generarPlanProyeccionReal_V2() {
    console.log('====================================================');
    console.log('  🗺️ E23.3.2 (V2): REAL CORPUS PROJECTION PLAN GENERATION');
    console.log('====================================================\n');

    const derivedTreePath = path.join(__dirname, '../salidaXHTML/e21-derived-tree.json');
    if (!fs.existsSync(derivedTreePath)) {
        console.error('❌ ERROR: No se encuentra e21-derived-tree.json. Ejecute E21 primero.');
        return;
    }

    const derivedTreeRaw = JSON.parse(fs.readFileSync(derivedTreePath, 'utf8'));

    // 🛠️ Condicionamiento taxonómico (Idéntico criterio de enriquecimiento aplicado en E22.3 V2)
    const enrichedTreeForProjection = {
        version: derivedTreeRaw.version || 'E21.0.0',
        nodes: derivedTreeRaw.nodes.map(node => {
            return {
                ...node,
                semanticType: 'ARTICULO',
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

    // Configuración oficial de estilos editoriales de InDesign (Capa Anticorrupción Inversa)
    const officialMappingRules = Object.freeze({
        'ARTICULO': { paragraphStyle: 'LD_Articulo_Principal', exportTag: 'article' },
        'PARRAFO': { paragraphStyle: 'LD_Cuerpo_Texto', exportTag: 'p' },
        'NUMERAL': { paragraphStyle: 'LD_Numeral_Item', exportTag: 'div' },
        'LITERAL': { paragraphStyle: 'LD_Literal_Item', exportTag: 'div' }
    });

    console.log('Generando plan de proyección a partir del AST enriquecido...\n');

    let projectionPlan;
    try {
        projectionPlan = ProjectionAdapter.generatePlan(enrichedTreeForProjection, officialMappingRules);
    } catch (e) {
        console.error('❌ ERROR CRÍTICO EN LA PROYECCIÓN:', e.message);
        return;
    }

    const outputPath = path.join(__dirname, '../salidaXHTML/e23-projection-plan.json');
    fs.writeFileSync(outputPath, JSON.stringify(projectionPlan, null, 2), 'utf8');

    console.log('====================================================');
    console.log('E23.3.2 — PROJECTION AUDIT RESULTS');
    console.log('====================================================\n');
    console.log(`Estado Global:                   ✅ PLAN GENERADO CON ÉXITO`);
    console.log(`Nodos Raíz Proyectados:          ${projectionPlan.nodes.length}`);
    console.log(`Reglas Editoriales Aplicadas:    4 Mapeos Explícitos`);
    console.log(`📁 Artefacto exportado en:       ${outputPath}`);
    console.log('====================================================\n');
}

generarPlanProyeccionReal_V2();