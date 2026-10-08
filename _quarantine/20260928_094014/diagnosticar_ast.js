// diagnosticar_ast.js
const fs = require('fs');
const path = require('path');

const ruta = path.join(__dirname, 'MisJSON', 'Fragmento.json');
const raw = fs.readFileSync(ruta, 'utf8');

// Obtener las primeras 2000 líneas para análisis estructural
const primerasLineas = raw.split('\n').slice(0, 2000).join('\n');

let ast;
try {
    ast = JSON.parse(primerasLineas + '\n}'); // asumiendo que se corta, pero mejor usamos una aproximación
} catch(e) {
    // Si falla, intentamos con un parseo incremental
    console.log('No se pudo parsear las primeras 2000 líneas. Intentando con el archivo completo...');
    ast = JSON.parse(raw);
}

console.log('Claves raíz:', Object.keys(ast));

// Buscar claves que contengan arrays grandes
for (const clave of Object.keys(ast)) {
    const valor = ast[clave];
    if (Array.isArray(valor)) {
        console.log(`  ${clave}: array de ${valor.length} elementos`);
        if (valor.length > 0) {
            console.log(`    Primer elemento tipo: ${typeof valor[0]}`);
            console.log(`    Primer elemento resumen: ${JSON.stringify(valor[0]).slice(0, 200)}`);
        }
    } else if (typeof valor === 'object' && valor !== null) {
        console.log(`  ${clave}: objeto con claves: ${Object.keys(valor).slice(0, 10).join(', ')}`);
    } else {
        console.log(`  ${clave}: ${typeof valor} = ${String(valor).slice(0, 100)}`);
    }
}