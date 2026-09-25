/**
 * src/validador/validadorXHTML.js
 * Validador automático estructural de XHTML para eliminar la inspección manual
 */
const fs = require('fs');
const path = require('path');

function validarArchivoXHTML(filePath, profile) {
    const violations = [];
    if (!fs.existsSync(filePath)) {
        return { isValid: false, violations: [`Archivo no encontrado en disco: ${filePath}`] };
    }

    const content = fs.readFileSync(filePath, 'utf8');

    // 1. Regla estructural universal: Presencia de etiquetas raíz semánticas o elementos permitidos
    if (!content.trim().startsWith('<') || !content.trim().endsWith('>')) {
        violations.push('ERR-VAL-001: El contenido no está bien formado como fragmento XML/XHTML.');
    }

    // 2. Reglas específicas por Perfil (Contrato C01-04)
    if (profile === 'WEB') {
        // En perfil WEB, ningún nodo debe contener atributos epub:type
        if (content.includes('epub:type')) {
            violations.push('ERR-VAL-002: El perfil WEB contiene atributos prohibidos [epub:type].');
        }
    } else if (profile === 'EPUB') {
        // En perfil EPUB, los títulos o secciones principales deben exigir semántica de accesibilidad si aplica
        if (content.includes('<section') && !content.includes('epub:type=')) {
            violations.push('ERR-VAL-003: Elemento <section> en perfil EPUB carece de atributo obligatorio [epub:type].');
        }
    }

    return {
        isValid: violations.length === 0,
        violations
    };
}

function validarDirectorioSalida(outputDir, profile) {
    const resolvedPath = path.resolve(process.cwd(), outputDir);
    if (!fs.existsSync(resolvedPath)) {
        return { success: false, error: `Directorio de salida no existe: ${resolvedPath}` };
    }

    const files = fs.readdirSync(resolvedPath).filter(f => f.endsWith('.xhtml'));
    let totalChecked = 0;
    let failedCount = 0;
    const reportDetails = [];

    for (const file of files) {
        totalChecked++;
        const filePath = path.join(resolvedPath, file);
        const result = validarArchivoXHTML(filePath, profile);

        if (!result.isValid) {
            failedCount++;
        }
        reportDetails.push({
            file,
            isValid: result.isValid,
            violations: result.violations
        });
    }

    return {
        success: failedCount === 0,
        totalChecked,
        failedCount,
        details: reportDetails
    };
}

module.exports = { validarArchivoXHTML, validarDirectorioSalida };
