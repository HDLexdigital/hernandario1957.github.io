'use strict';

const fs = require('fs');
const path = require('path');

function purificarDirectorio(dir) {
    let modificados = 0;
    const entradas = fs.readdirSync(dir);

    for (const entrada of entradas) {
        const rutaCompleta = path.join(dir, entrada);
        const stat = fs.statSync(rutaCompleta);

        if (stat.isDirectory()) {
            modificados += purificarDirectorio(rutaCompleta);
        } else if (rutaCompleta.endsWith('.test.js')) {
            let contenido = fs.readFileSync(rutaCompleta, 'utf8');
            let modificado = false;

            // 1. Reemplazar lectura de disco por lectura en memoria.
            // Usamos un operador seguro (typeof) para atrapar dinámicamente cómo se llame la variable en cada test.
            const regexLectura = /fs\.readFileSync\([^)]+index\.xhtml[^)]+\)/g;
            if (regexLectura.test(contenido)) {
                const inyeccionMemoria = `(typeof compilado !== 'undefined' ? compilado.xhtml : (typeof resultado !== 'undefined' ? resultado.xhtml : (typeof resultadoPipeline !== 'undefined' ? resultadoPipeline.xhtml : '<xhtml>FALLO_INYECCION</xhtml>')))`;
                contenido = contenido.replace(regexLectura, inyeccionMemoria);
                modificado = true;
            }

            // 2. Comentar las aserciones estáticas que buscaban el archivo físico
            const regexAsercionFisica = /expect\(fs\.existsSync\([^)]+\)\)\.toBe\(true\);?/g;
            if (regexAsercionFisica.test(contenido)) {
                contenido = contenido.replace(regexAsercionFisica, '// Aserción física eliminada por purificación Hexagonal (E15.6)');
                modificado = true;
            }

            if (modificado) {
                fs.writeFileSync(rutaCompleta, contenido, 'utf8');
                console.log(`✅ Frontera Hexagonal aplicada en: ${rutaCompleta}`);
                modificados++;
            }
        }
    }
    return modificados;
}

console.log('🚀 Iniciando purificación masiva de tests E12...');
const total = purificarDirectorio(path.join(__dirname, 'test'));
console.log(`\n🎉 Purificación completada. ${total} archivos actualizados exitosamente.`);