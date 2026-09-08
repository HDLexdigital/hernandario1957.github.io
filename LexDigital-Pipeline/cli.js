'use strict';
const fs = require('fs');
const path = require('path');
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
    const contenidoCrudo = fs.readFileSync(archivoEntrada, 'utf8');
    const nombreBase = path.basename(archivoEntrada, path.extname(archivoEntrada));
    const lineas = contenidoCrudo.split(/\r?\n/).filter(l => l.trim().length > 0);
    const listaParrafos = lineas.map((linea, index) => ({
        id: index + 1,
        tipo: "texto_cuerpo",
        texto: linea.trim()
    }));
    const jsonEstructurado = {
        documento: {
            titulo: nombreBase,
            totalParrafos: listaParrafos.length,
            fechaProceso: new Date().toISOString()
        },
        contenido: listaParrafos
    };
    console.log(`⚙️ Procesando ${listaParrafos.length} párrafos...`);
    const inicioTiempo = Date.now();
    const resultado = {
        metadatos: { 
            tiempoTotal: Date.now() - inicioTiempo, 
            parrafosProcesados: listaParrafos.length 
        },
        resultado: jsonEstructurado
    };
    const archivoSalida = path.join(path.dirname(archivoEntrada), `${nombreBase}_salida.json`);
    fs.writeFileSync(archivoSalida, JSON.stringify(resultado, null, 2), 'utf8');
    console.log("------------------------------------------");
    console.log("🎉 ¡Compilación por terminal exitosa!");
    console.log(`📄 Archivo generado: ${archivoSalida}`);
    console.log(`⏱️ Tiempo de procesamiento: ${Date.now() - inicioTiempo}ms`);
} catch (error) {
    console.error(`❌ Error crítico procesando el archivo: ${error.message}`);
}