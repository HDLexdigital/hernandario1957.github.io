'use strict';

const fs = require('fs');
const path = require('path');

const rutaValidador = path.join(__dirname, 'src', 'core', 'validators', 'ContentSchemaValidator.js');

try {
    const contenido = fs.readFileSync(rutaValidador, 'utf8');
    
    // Buscamos la definición del Set TIPOS_VALIDOS
    const regex = /const TIPOS_VALIDOS = new Set\(\[(.*?)\]\);/s;
    const match = contenido.match(regex);

    if (match) {
        console.log('✅ TIPOS_VALIDOS encontrado correctamente.');
        console.log('Lista de tipos actuales:', match[1].trim());
    } else {
        console.log('⚠️ No se pudo extraer la lista de TIPOS_VALIDOS mediante regex.');
        console.log('Contenido del archivo para auditoría manual:');
        console.log(contenido);
    }
} catch (err) {
    console.error('❌ Error al intentar leer el validador:', err.message);
}