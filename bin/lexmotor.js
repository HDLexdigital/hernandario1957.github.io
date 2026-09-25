#!/usr/bin/env node
/**
 * bin/lexmotor.js
 * Interfaz de Línea de Comandos (CLI) para LexDigital Style Exporter
 * Uso: node bin/lexmotor.js <archivo_entrada.json> [directorio_salida]
 */
const fs = require('fs');
const path = require('path');
const { compilarLexmotor } = require('../src/compiladores/compilarLexmotor.js');

// Capturar argumentos de la línea de comandos
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
 LexDigital Style Exporter CLI (v1.0.0)
 --------------------------------------
 Uso: lexmotor <ruta/al/documento.json> [ruta/al/directorio_salida]
 
 Ejemplo:
   node bin/lexmotor.js MisJSON/Sentencia_123.json salidaXHTML/
 `);
    process.exit(0);
}

const inputPath = path.resolve(args[0]);
const outputDir = args[1] ? path.resolve(args[1]) : path.join(path.dirname(inputPath), '../salidaXHTML');

// Extraer el nombre base sin extensión
const baseName = path.basename(inputPath, path.extname(inputPath));
const outputPath = path.join(outputDir, `${baseName}.html`);

console.log(`[Lexmotor] Iniciando compilación de: ${baseName}`);

try {
    // 1. Verificar si el archivo existe
    if (!fs.existsSync(inputPath)) {
        throw new Error(`El archivo de entrada no existe: ${inputPath}`);
    }

    // 2. Leer archivo JSON crudo
    const rawData = fs.readFileSync(inputPath, 'utf-8');
    const jsonCrudo = JSON.parse(rawData);

    // 3. Crear directorio de salida si no existe
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // 4. Compilar usando el motor principal (la validación Zod se ejecuta adentro)
    const resultado = compilarLexmotor(jsonCrudo, baseName, {});

    // 5. Escribir el XHTML resultante
    fs.writeFileSync(outputPath, resultado.xhtml, 'utf-8');

    console.log(`[Lexmotor] Éxito: Archivo exportado en ${outputPath}`);
    process.exit(0);

} catch (error) {
    console.error(`\n[ERROR FATAL] La compilación falló:`);
    console.error(error.message);
    process.exit(1);
}
