/**
 * interfaces/cli.js
 * Interfaz de Línea de Comandos para procesar un documento individual.
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { compilarLexmotor } = require('../index');
const { guardarPublicacion } = require('../utils/fileSystem');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ejecutarCLI(rutaJson) {
    try {
        const rutaLimpia = rutaJson.trim().replace(/^['"]|['"]$/g, '');
        const rutaAbsoluta = path.resolve(rutaLimpia);

        if (!fs.existsSync(rutaAbsoluta)) {
            console.error(`\n❌ Error: No existe el archivo: "${rutaAbsoluta}"`);
            rl.close();
            return;
        }

        console.log(`\n⏳ Leyendo archivo JSON: ${path.basename(rutaAbsoluta)}...`);
        const contenidoCrudo = fs.readFileSync(rutaAbsoluta, 'utf-8');
        const dataOriginal = JSON.parse(contenidoCrudo);
        const nombreBase = path.basename(rutaAbsoluta, '.json');

        console.log(`⏳ Procesando con el motor LexDigital...`);
        // ¡Aquí llamamos a tu motor modular!
        const { jsonOficial, xhtml } = compilarLexmotor(dataOriginal, nombreBase);

        console.log(`⏳ Guardando archivos de salida...`);
        const { dirSalida, rutaXHTML } = guardarPublicacion(nombreBase, jsonOficial, xhtml);

        console.log(`\n✅ ¡Proceso completado con éxito!`);
        console.log(`📊 Nodos procesados: ${jsonOficial.totalTokens}`);
        console.log(`📁 Directorio de salida: ${dirSalida}`);
        console.log(`📄 Archivo XHTML listo en: ${rutaXHTML}\n`);

    } catch (error) {
        console.error('\n❌ Ocurrió un error inesperado:', error);
    } finally {
        rl.close();
    }
}

// Lógica de inicio por consola
const argumentoConsola = process.argv[2];
if (argumentoConsola) {
    ejecutarCLI(argumentoConsola);
} else {
    rl.question('📌 Introduce la ruta del archivo JSON a procesar: ', (respuesta) => {
        if (respuesta.trim()) ejecutarCLI(respuesta);
        else rl.close();
    });
}