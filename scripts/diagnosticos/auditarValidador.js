'use strict';

const path = require('path');
const ContentSchemaValidator = require('./src/core/validators/ContentSchemaValidator');

console.log('--- AUDITORÍA DE CONTENT SCHEMA VALIDATOR ---');
try {
    // Intentamos inspeccionar las propiedades o exportaciones del validador
    console.log('Exportaciones del validador:', ContentSchemaValidator);
    
    if (typeof ContentSchemaValidator.obtenerTiposValidos === 'function') {
        console.log('Tipos válidos oficiales:', ContentSchemaValidator.obtenerTiposValidos());
    } else if (ContentSchemaValidator.TIPOS_VALIDOS) {
        console.log('TIPOS_VALIDOS:', ContentSchemaValidator.TIPOS_VALIDOS);
    }
} catch (err) {
    console.error('❌ No se pudo invocar el validador directamente:', err.message);
}