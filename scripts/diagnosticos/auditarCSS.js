/**
 * auditarCSS.js
 * Herramienta de auditoría y purga segura para InDesign
 * Diseñada para evitar que el archivo de destino quede vacío.
 */

const fs = require('fs');
const path = require('path');
const { purgarCSSInDesign } = require('./src/utils/cssPurifier');

// Rutas explícitas de origen y destino
const rutaOrigen = path.join(__dirname, 'src', 'assets', 'miEstiloJuridico.css');
const rutaDestino = path.join(__dirname, 'src', 'assets', 'miEstiloJuridico.css');

try {
    // 1. Verificamos que el archivo de origen exista
    if (!fs.existsSync(rutaOrigen)) {
        console.error(`❌ Error crítico: No se encuentra el archivo CSS en la ruta: ${rutaOrigen}`);
        process.exit(1);
    }

    console.log(`🔍 Leyendo estilos desde: ${rutaOrigen}`);
    const cssCrudo = fs.readFileSync(rutaOrigen, 'utf8');

    // 2. Validación de seguridad: Si el archivo está vacío en origen, no sobreescribimos
    if (!cssCrudo || cssCrudo.trim() === '') {
        console.error(`⚠️ Advertencia de seguridad: El archivo origen está vacío. No se realizaron cambios para evitar pérdida de datos.`);
        process.exit(1);
    }

    // 3. Aplicamos la purga experta de InDesign
    const cssDepurado = purgarCSSInDesign(cssCrudo);

    // 4. Segunda validación de seguridad: Asegurar que el resultado depurado tenga contenido antes de escribir
    if (!cssDepurado || cssDepurado.trim() === '') {
        console.error(`❌ Error crítico: El proceso de purga devolvió un texto vacío. Se cancela la escritura.`);
        process.exit(1);
    }

    // 5. Escritura segura del archivo limpio
    fs.writeFileSync(rutaDestino, cssDepurado, 'utf8');
    console.log('✨ ¡Éxito! miEstiloJuridico.css ha sido depurado y guardado correctamente con todo su contenido.');

} catch (error) {
    console.error('❌ Error inesperado durante la auditoría del CSS:', error.message);
}