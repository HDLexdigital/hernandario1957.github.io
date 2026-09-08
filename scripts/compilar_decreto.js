'use strict';
const fs = require('fs');
const path = require('path');
const { compilarLexmotor } = require('../src/core/compiladores/compilarLexmotor');
const { generarCSSDesdePropiedades } = require('../LexDigital-Pipeline/core/generadorCSS');
const RUTA_JSON = 'publicaciones/decreto252/decreto252_corregido.json';
const RUTA_SALIDA = 'salidaXHTML/decreto252_FINAL.xhtml';
function log(m) { console.log('✅ ' + m); }
function error(m) { console.error('❌ ' + m); }
async function compilarDecreto() {
    log('=============================================');
    log('   LEXDIGITALHD - DECRETO 252 CON CSS');
    log('=============================================');
    // 1. Leer JSON
    log('Leyendo JSON...');
    const jsonDecreto = JSON.parse(fs.readFileSync(RUTA_JSON, 'utf8'));
    const tokenUnico = jsonDecreto.tokens[0];
    const contenidoReal = tokenUnico.contenido || [];
    log('Documento: ' + tokenUnico.documento);
    log('Párrafos: ' + contenidoReal.length);
    // 2. Mapear con propiedades
    const contenido = contenidoReal.map((parrafo, index) => ({
        id: index + 1,
        texto: parrafo.texto || '',
        inDesignStyle: parrafo.estilo || 'P01_BODY_BASE',
        propiedades: parrafo.propiedadesEstilo || {}
    }));
    // 3. Compilar
    const inicio = Date.now();
    const resultado = compilarLexmotor({ contenido }, {});
    const tiempo = Date.now() - inicio;
    if (resultado && resultado.xhtml) {
        // 4. Generar CSS desde propiedades
        const cssGenerado = generarCSSDesdePropiedades(contenido);
        // 5. Inyectar CSS en el XHTML
        const xhtmlConCSS = resultado.xhtml.replace(
            '</head>',
            '  <style>\n' + cssGenerado + '  </style>\n</head>'
        );
        // 6. Guardar
        fs.writeFileSync(RUTA_SALIDA, xhtmlConCSS, 'utf8');
        const h1 = (xhtmlConCSS.match(/<h1/g) || []).length;
        const h2 = (xhtmlConCSS.match(/<h2/g) || []).length;
        const p = (xhtmlConCSS.match(/<p/g) || []).length;
        log('=============================================');
        log('   RESULTADO CON CSS');
        log('=============================================');
        log('XHTML: ' + xhtmlConCSS.length + ' bytes');
        log('CSS: ' + cssGenerado.length + ' bytes');
        log('  <h1>: ' + h1);
        log('  <h2>: ' + h2);
        log('  <p>: ' + p);
        log('Guardado: ' + RUTA_SALIDA);
    } else {
        error('No XHTML');
    }
}
compilarDecreto().catch(e => {
    error(e.message);
    process.exit(1);
});