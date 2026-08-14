/**
 * interfaces/batchProcessor.js
 * Procesa masivamente todos los archivos JSON dentro de una carpeta específica.
 */
const fs = require('fs');
const path = require('path');
const { compilarLexmotor } = require('../index');
const { guardarPublicacion } = require('../utils/fileSystem');

function procesarCarpeta(rutaCarpeta) {
    const directorioBase = path.resolve(rutaCarpeta);

    if (!fs.existsSync(directorioBase)) {
        console.error(`\n❌ Error: El directorio "${directorioBase}" no existe.`);
        process.exit(1);
    }

    const archivos = fs.readdirSync(directorioBase).filter(file => file.endsWith('.json') && !file.includes('_corregido'));
    
    if (archivos.length === 0) {
        console.log(`\n⚠️ No se encontraron archivos JSON válidos en: ${directorioBase}`);
        return;
    }

    console.log(`\n=================================================`);
    console.log(`🚀 INICIANDO PROCESAMIENTO POR LOTES (${archivos.length} archivos)`);
    console.log(`=================================================\n`);

    let exitosos = 0;
    let fallidos = 0;

archivos.forEach((archivo, i) => {
        const rutaCompleta = path.join(directorioBase, archivo);
        const nombreBase = path.basename(archivo, '.json');
        
        // AQUÍ DEFINIMOS LA VARIABLE QUE FALTABA
        const nombreAsignadoCSS = `${nombreBase}.css`; 
        
        try {
            process.stdout.write(`[${i + 1}/${archivos.length}] Procesando ${archivo}... `);
            
            const contenidoCrudo = fs.readFileSync(rutaCompleta, 'utf-8');
            const dataOriginal = JSON.parse(contenidoCrudo);
            
            // AQUÍ SE LA PASAMOS AL MOTOR
            const { jsonOficial, xhtml } = compilarLexmotor(dataOriginal, nombreBase, nombreAsignadoCSS);
            guardarPublicacion(nombreBase, jsonOficial, xhtml);
            
            console.log(`✅ OK`);
            exitosos++;
        } catch (error) {
            console.log(`❌ FALLÓ (${error.message})`);
            fallidos++;
        }
		const fs = require('fs');
const path = require('path');
// 1. IMPORTA LA UTILIDAD DE PURIFICACIÓN DE CSS
const { purgarCSSInDesign } = require('../utils/cssPurifier'); 

// ... (resto de tus configuraciones y directorios)

archivos.forEach((archivo, i) => {
    const rutaCompleta = path.join(directorioBase, archivo);
    const nombreBase = path.basename(archivo, '.json');
    const nombreAsignadoCSS = `${nombreBase}.css`;
    
    // Ruta donde se encuentra la hoja de estilo original exportada de InDesign
    const rutaCSSOriginal = path.join(__dirname, '../estilos', nombreAsignadoCSS);
    const rutaCSSDestino = path.join(__dirname, '../estilos', `limpio_${nombreAsignadoCSS}`);

    try {
        process.stdout.write(`[${i + 1}/${archivos.length}] Procesando ${archivo}... `);

        // 2. SI EXISTE EL CSS GEMELO, LÉELO Y PURIFÍCALO AUTOMÁTICAMENTE
        if (fs.existsSync(rutaCSSOriginal)) {
            const cssBruto = fs.readFileSync(rutaCSSOriginal, 'utf-8');
            const cssDepurado = purgarCSSInDesign(cssBruto);
            
            // Opcional: Guárdalo ya purificado para que el HTML lo use sin errores
            fs.writeFileSync(rutaCSSOriginal, cssDepurado, 'utf-8');
        }

        const contenidoCrudo = fs.readFileSync(rutaCompleta, 'utf-8');
        const dataOriginal = JSON.parse(contenidoCrudo);
        
        const { jsonOficial, xhtml } = compilarLexmotor(dataOriginal, nombreBase, nombreAsignadoCSS);
        guardarPublicacion(nombreBase, jsonOficial, xhtml);
        
        console.log(`✅ OK (CSS depurado)`);
        exitosos++;
    } catch (error) {
        console.log(`❌ FALLÓ (${error.message})`);
        fallidos++;
    }
    });

    console.log(`\n=================================================`);
    console.log(`📊 REPORTE FINAL DEL LOTE`);
    console.log(`✅ Exitosos: ${exitosos} | ❌ Fallidos: ${fallidos}`);
    console.log(`=================================================\n`);
}

// Ejecutar pasándole una carpeta como argumento
const carpetaInput = process.argv[2];
if (!carpetaInput) {
    console.log("📌 Uso: node interfaces/batchProcessor.js <ruta_a_tu_carpeta_con_jsons>");
} else {
    procesarCarpeta(carpetaInput);
}