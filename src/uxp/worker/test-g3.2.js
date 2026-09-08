/**
 * Lexmotor - Test de Determinismo y Fidelidad (G3.2)
 * Compara las ejecuciones A y B mediante SHA-256 e inspecciona el AST renderizado.
 */
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const outputDir = "C:\\Users\\PC\\AppData\\Roaming\\Adobe\\UXP\\PluginsStorage\\IDSN\\21\\Developer\\com.lexmotor.uxp\\PluginData\\ipc";
const fileA = path.join(outputDir, 'index_A.xhtml');
const fileB = path.join(outputDir, 'index.xhtml');

function getHash(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
}

console.log("\n==================================================");
console.log("   G3.2 — VALIDACIÓN DE ARTEFACTOS Y DETERMINISMO");
console.log("==================================================\n");

try {
    const hashA = getHash(fileA);
    const hashB = getHash(fileB);

    console.log(`[SHA-256] Ejecución A (index_A.xhtml): ${hashA}`);
    console.log(`[SHA-256] Ejecución B (index.xhtml):   ${hashB}\n`);

    if (hashA === hashB) {
        console.log("✅ DETERMINISMO E2E CONFIRMADO (Los hashes coinciden al 100%)\n");
    } else {
        console.log("❌ DIVERGENCIA DETECTADA (Los compilados difieren)\n");
    }

    // Inspección de Fidelidad Editorial (Primeros 500 caracteres)
    console.log("--- INSPECCIÓN DE ESTRUCTURA (Primeros 500 bytes de B) ---");
    const sample = fs.readFileSync(fileB, 'utf8').substring(0, 500);
    console.log(sample);
    console.log("----------------------------------------------------------\n");

} catch (error) {
    console.error("Error durante la validación:", error.message);
    console.log("Asegúrate de haber renombrado index_A.xhtml y generado el nuevo index.xhtml en InDesign.");
}