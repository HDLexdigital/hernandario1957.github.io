'use strict';

const fs = require('fs');
const path = require('path');

const inputJson = path.join(__dirname, 'MisJSON', 'Constitución_Politica_Colombia.json');

try {
    let contenidoCrudo = fs.readFileSync(inputJson, 'utf8');
    // Limpieza de posible BOM (Byte Order Mark)
    contenidoCrudo = contenidoCrudo.replace(/^\uFEFF/, '');

    const jsonCrudo = JSON.parse(contenidoCrudo);

    console.log('--- INSPECCIÓN DE CLAVES DEL JSON ---');
    console.log('Claves de nivel raíz:', Object.keys(jsonCrudo));
    
    if (jsonCrudo.contenido) {
        console.log('Total párrafos en contenido:', jsonCrudo.contenido.length);
        console.log('Primer párrafo:', JSON.stringify(jsonCrudo.contenido[0], null, 2));
    } else {
        console.log('⚠️ El objeto raíz NO contiene la propiedad "contenido". Muestra del JSON completo:');
        console.log(JSON.stringify(jsonCrudo, null, 2).substring(0, 500));
    }

} catch (err) {
    console.error('❌ Error al parsear el archivo JSON:', err.message);
}