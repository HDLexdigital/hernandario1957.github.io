const fs = require('fs');
const path = require('path');

// 1. Validar argumentos de la terminal
const args = process.argv.slice(2);
if (args.length === 0) {
    console.error("❌ Error: Debes proporcionar la ruta del archivo.");
    console.log("Uso en terminal: node procesar.js <ruta-del-archivo>");
    process.exit(1);
}

const archivoRuta = path.resolve(args[0]);

if (!fs.existsSync(archivoRuta)) {
    console.error(`❌ Error: El archivo no existe en la ruta: ${archivoRuta}`);
    process.exit(1);
}

const extension = path.extname(archivoRuta).toLowerCase();
const nombreBase = path.basename(archivoRuta, extension);
const contenidoCrudo = fs.readFileSync(archivoRuta, 'utf8');

console.log(`📂 Leyendo archivo fuente: ${path.basename(archivoRuta)}...`);

let resultadoProcesado = {};
const inicioTiempo = Date.now();

try {
    // 2. Procesamiento según el tipo de archivo de entrada
    if (extension === '.json') {
        // Manejo del JSON enriquecido proveniente de InDesign
        const datosInDesign = JSON.parse(contenidoCrudo);
        console.log("⚙️ Procesando JSON estructurado de InDesign...");
        
        resultadoProcesado = {
            origen: "InDesign (JSON Enriquecido)",
            metadatos: {
                titulo: nombreBase,
                fechaProceso: new Date().toISOString()
            },
            contenido: datosInDesign
        };

    } else {
        // Manejo de archivos de Texto Plano o Markdown (.txt / .md)
        console.log("⚙️ Procesando texto plano o Markdown...");
        const lineas = contenidoCrudo.split(/\r?\n/).filter(l => l.trim().length > 0);
        
        const listaParrafos = lineas.map((linea, index) => {
            const esTitulo = linea.startsWith('#');
            return {
                id: index + 1,
                tipoEstilo: esTitulo ? 'Titulo_Seccion' : 'Cuerpo_Texto',
                texto: linea.replace(/^#+\s*/, '').trim()
            };
        });

        resultadoProcesado = {
            origen: "Texto / Markdown",
            metadatos: {
                titulo: nombreBase,
                totalParrafos: listaParrafos.length,
                fechaProceso: new Date().toISOString()
            },
            contenido: listaParrafos
        };
    }

    const tiempoTotal = Date.now() - inicioTiempo;

    // 3. Crear directorio de salidas si no existe y guardar resultado
    const directorioSalida = path.join(path.dirname(archivoRuta), 'salidas');
    if (!fs.existsSync(directorioSalida)) {
        fs.mkdirSync(directorioSalida, { recursive: true });
    }

    const archivoSalida = path.join(directorioSalida, `${nombreBase}_compilado.json`);
    fs.writeFileSync(archivoSalida, JSON.stringify(resultadoProcesado, null, 2), 'utf8');

    console.log("--------------------------------------------------");
    console.log("🎉 ¡Procesamiento por terminal completado con éxito!");
    console.log(`📄 Archivo generado: ${archivoSalida}`);
    console.log(`⏱️ Tiempo de ejecución: ${tiempoTotal}ms`);

} catch (error) {
    console.error(`❌ Error crítico procesando el archivo: ${error.message}`);
    process.exit(1);
}