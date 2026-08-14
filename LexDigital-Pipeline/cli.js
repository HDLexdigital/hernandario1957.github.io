const fs = require('fs');
const path = path = require('path');

// Obtener la ruta del archivo pasado por argumento desde la terminal
const args = process.argv.slice(2);
if (args.length === 0) {
    console.log("❌ Uso incorrecto.");
    console.log("Ejemplo: node cli.js documentos/texto_legal.txt");
    process.exit(1);
}

const archivoEntrada = path.resolve(args[0]);

if (!fs.existsSync(archivoEntrada)) {
    console.error(`❌ Error: No se encontró el archivo en la ruta: ${archivoEntrada}`);
    process.exit(1);
}

console.log(`📂 Leyendo archivo fuente: ${path.basename(archivoEntrada)}...`);

try {
    // Leer el contenido del archivo
    const contenidoCrudo = fs.readFileSync(archivoEntrada, 'utf8');
    const nombreBase = path.basename(archivoEntrada, path.extname(archivoEntrada));

    // Estructurar los párrafos de manera automática
    const lineas = contenidoCrudo.split(/\r?\n/).filter(l => l.trim().length > 0);
    const listaParrafos = lineas.map(linea => ({
        tipo: "texto_cuerpo",
        texto: linea.trim()
    }));

    const jsonEstructurado = {
        documento: { titulo: nombreBase },
        contenido: listaParrafos
    };

    console.log(`⚙️ Procesando ${listaParrafos.length} párrafos a través del motor...`);

    // ==========================================
    // AQUí INTEGRAS TU MOTOR O ADAPTADOR REAL
    // Ejemplo: const resultado = jsonEditorialAdapter(jsonEstructurado);
    // ==========================================
    const resultadoSimulado = {
        metadatos: { tiempoTotal: 45, parrafosProcesados: listaParrafos.length },
        resultado: jsonEstructurado
    };

    // Guardar el resultado procesado en un archivo JSON de salida
    const archivoSalida = path.join(path.dirname(archivoEntrada), `${nombreBase}_salida.json`);
    fs.writeFileSync(archivoSalida, JSON.stringify(resultadoSimulado, null, 2), 'utf8');

    console.log("------------------------------------------");
    console.log("🎉 ¡Compilación por terminal exitosa!");
    console.log(`📄 Archivo generado: ${archivoSalida}`);
    console.log(`⏱️ Tiempo de procesamiento: ${resultadoSimulado.metadatos.tiempoTotal}ms`);

} catch (error) {
    console.error(`❌ Error crítico procesando el archivo: ${error.message}`);
}