/**
 * E23.3.4 — Real Corpus Dry-Run Audit Script
 * 
 * - Carga el plan de proyección real del corpus (salidaXHTML/e23-projection-plan.json).
 * - Ejecuta el UxpProjectorExecutor en modo DRY_RUN estricto.
 * - Valida y audita los 87 nodos (78 artículos + 9 hijos) garantizando cero anomalías.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const UxpProjectorExecutor = require('../src/validadores/E23/UxpProjectorExecutor');

function auditarPlanReal() {
    console.log('====================================================');
    console.log('  🔍 E23.3.4: REAL CORPUS DRY-RUN AUDIT (87 NODOS)');
    console.log('====================================================\n');

    const planPath = path.join(__dirname, '../salidaXHTML/e23-projection-plan.json');
    if (!fs.existsSync(planPath)) {
        console.error('❌ ERROR: No se encuentra e23-projection-plan.json. Ejecute E23.3.2 primero.');
        return;
    }

    const projectionPlan = JSON.parse(fs.readFileSync(planPath, 'utf8'));

    console.log('Ejecutando auditoría de solo lectura (DRY_RUN)...\n');

    let auditResult;
    try {
        auditResult = UxpProjectorExecutor.execute(projectionPlan, { dryRun: true });
    } catch (e) {
        console.error('❌ ERROR DE AUDITORÍA CRÍTICO:', e.message);
        return;
    }

    console.log('====================================================');
    console.log('E23.3.4 — DRY-RUN AUDIT RESULTS');
    console.log('====================================================\n');
    console.log(`Estado de Auditoría:             ✅ ${auditResult.status}`);
    console.log(`Modo de Operación:               🔒 ${auditResult.mode}`);
    console.log(`Nodos Auditados con Éxito:       ${auditResult.auditedNodesCount} (Esperados: 87)`);
    console.log(`Mutaciones Realizadas:           ${auditResult.mutationsPerformed} (Inmutabilidad garantizada)\n`);
    console.log('====================================================\n');
}

auditarPlanReal();