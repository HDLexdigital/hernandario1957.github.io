/**
 * E22.4.2 / E22.4.3 — Real XHTML Validation & Accessibility Audit
 * 
 * - Consume el artefacto físico exportado: corpus-lexdigital.xhtml.
 * - Ejecuta el validador de Accesibilidad y Semántica (Read-Only).
 * - Evalúa: Unicidad de IDs, Inyección de Provenance, y Semántica ARIA.
 * - Genera el reporte de auditoría inmutable.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const AccessibilityValidator = require('../src/validadores/E22/AccessibilityValidator');

function ejecutarAuditoriaAccesibilidadE22() {
    console.log('====================================================');
    console.log('  🔍 E22.4: REAL XHTML ACCESSIBILITY & SEMANTIC AUDIT');
    console.log('====================================================\n');

    const xhtmlPath = path.join(__dirname, '../salidaXHTML/corpus-lexdigital.xhtml');

    if (!fs.existsSync(xhtmlPath)) {
        console.error('❌ ERROR: No se encuentra corpus-lexdigital.xhtml. Ejecute E22.3 primero.');
        return;
    }

    // Leer el archivo XHTML como cadena cruda
    const xhtmlRawString = fs.readFileSync(xhtmlPath, 'utf8');

    console.log('Iniciando auditoría read-only sobre el documento físico...\n');

    // Ejecutar el validador (Fase Read-Only)
    let auditReport;
    try {
        auditReport = AccessibilityValidator.audit(xhtmlRawString);
    } catch (e) {
        console.error('❌ ERROR CONTRACTUAL EN EL VALIDADOR:', e.message);
        return;
    }

    console.log('====================================================');
    console.log('E22.4 — ACCESSIBILITY AUDIT RESULTS');
    console.log('====================================================\n');
    
    if (auditReport.status === 'PASS') {
        console.log('✅ ESTADO GLOBAL: PASS (XHTML Semántico y Accesible)');
    } else if (auditReport.status === 'WARNING') {
        console.log('⚠️ ESTADO GLOBAL: WARNING (Se detectaron antipatrones)');
    } else {
        console.log('❌ ESTADO GLOBAL: FAIL (Violaciones estructurales detectadas)');
    }

    console.log(`\nErrores Encontrados:   ${auditReport.errors.length}`);
    auditReport.errors.forEach(err => console.log(`  - [${err.code}] ${err.message}`));

    console.log(`\nAdvertencias (Warnings): ${auditReport.warnings.length}`);
    auditReport.warnings.forEach(warn => console.log(`  - [${warn.code}] ${warn.message}`));

    // Guardar el artefacto de auditoría
    const outputReportPath = path.join(__dirname, '../salidaXHTML/e22-accessibility-semantic-audit-report.json');
    fs.writeFileSync(outputReportPath, JSON.stringify(auditReport, null, 2), 'utf8');

    console.log(`\n📁 Reporte de auditoría guardado en: ${outputReportPath}`);
    console.log('====================================================\n');

    if (auditReport.status === 'PASS') {
        console.log('🔓 CANDADO E22.5 LIBERADO: El documento es apto para empaquetado EPUB3.');
    } else {
        console.log('🔒 CANDADO E22.5 BLOQUEADO: Resuelva las incidencias antes de empaquetar.');
    }
}

ejecutarAuditoriaAccesibilidadE22();