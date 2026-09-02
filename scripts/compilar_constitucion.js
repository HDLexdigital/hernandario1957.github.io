'use strict';
/**
 * LEXDIGITALHD - COMPILADOR DE CONSTITUCIÓN
 * Herramienta oficial para compilar documentos legales
 * 
 * Uso: node scripts/compilar_constitucion.js
 */
const fs = require('fs');
const path = require('path');
const { compilarLexmotor } = require('../src/core/compiladores/compilarLexmotor');
const RUTA_JSON = process.argv[2] || 'publicaciones/Constitución_Politica_Colombia/Constitución_Politica_Colombia_corregido.json';
const RUTA_SALIDA = process.argv[3] || 'salidaXHTML/constitucion_FINAL.xhtml';
function log(mensaje) {
    console.log('✅ [' + new Date().toISOString() + '] ' + mensaje);
}
function error(mensaje) {
    console.error('❌ [' + new Date().toISOString() + '] ' + mensaje);
}
async function compilarConstitucion() {
    log('=============================================');
    log('   LEXDIGITALHD - COMPILADOR CONSTITUCIÓN');
    log('=============================================');
    // 1. Leer JSON
    log('Leyendo JSON: ' + RUTA_JSON);
    if (!fs.existsSync(RUTA_JSON)) {
        error('Archivo no encontrado: ' + RUTA_JSON);
        process.exit(1);
    }
    const jsonConstitucion = JSON.parse(fs.readFileSync(RUTA_JSON, 'utf8'));
    log('Documento: ' + jsonConstitucion.documento);
    log('Tokens: ' + jsonConstitucion.tokens.length);
    // 2. Mapear tokens
    const contenido = jsonConstitucion.tokens.map((token, index) => ({
        id: index + 1,
        texto: token.texto_completo || token.texto_limpio || '',
        inDesignStyle: token.estilo_indesign || 'P01_BODY_BASE',
        tipo: token.tipo || 'parrafo',
        nivel: token.nivel || 0,
        numero: token.numero || null
    }));
    log('Elementos mapeados: ' + contenido.length);
    // 3. Compilar
    const inicio = Date.now();
    log('Compilando...');
    const resultado = compilarLexmotor({ contenido }, {});
    const tiempo = Date.now() - inicio;
    log('Compilación completada en ' + tiempo + 'ms');
    // 4. Verificar
    if (!resultado || !resultado.xhtml) {
        error('No se generó XHTML');
        process.exit(1);
    }
    // 5. Guardar
    fs.writeFileSync(RUTA_SALIDA, resultado.xhtml, 'utf8');
    // 6. Estadísticas
    const h1 = (resultado.xhtml.match(/<h1/g) || []).length;
    const h2 = (resultado.xhtml.match(/<h2/g) || []).length;
    const p = (resultado.xhtml.match(/<p/g) || []).length;
    const violaciones = (resultado.xhtml.match(/class="[^"]*parrafo[^"]*"/g) || []).length;
    log('=============================================');
    log('   RESULTADO FINAL');
    log('=============================================');
    log('XHTML: ' + resultado.xhtml.length + ' bytes');
    log('  <h1>: ' + h1);
    log('  <h2>: ' + h2);
    log('  <p>: ' + p);
    log('  Violaciones: ' + violaciones);
    log('Guardado en: ' + RUTA_SALIDA);
    log('=============================================');
}
compilarConstitucion().catch(err => {
    error(err.message);
    process.exit(1);
});