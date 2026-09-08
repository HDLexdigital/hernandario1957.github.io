'use strict';

const fs = require('fs');
const path = require('path');

const rutaValidador = path.join(__dirname, 'src', 'core', 'validators', 'ContentSchemaValidator.js');

try {
    const codigo = fs.readFileSync(rutaValidador, 'utf8');
    console.log('--- CÓDIGO FUENTE DE ContentSchemaValidator.js ---');
    console.log(codigo);
} catch (err) {
    console.error('❌ No se pudo leer el archivo:', err.message);
}