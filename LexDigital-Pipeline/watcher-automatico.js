'use strict';
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
// Rutas
const PLUGIN_JSON = 'C:/Users/PC/AppData/Roaming/Adobe/UXP/PluginsStorage/IDSN/21/Developer/com.lexmotor.uxp/PluginData/documento_extraido.json';
const SALIDA_XHTML = 'H:/LexDigital/Recursos/AUTOMATIZAR INDESIGN/proyecto-lexdigital_modular/salidaXHTML';
console.log('=============================================');
console.log('   WATCHER AUTOMÁTICO: PLUGIN → COMPILADOR');
console.log('=============================================');
console.log('Observando:', PLUGIN_JSON);
console.log('Salida:', SALIDA_XHTML);
console.log('=============================================');
let procesando = false;
async function compilarJSON(jsonData) {
    try {
        const { compilarLexmotor } = require('../src/core/compiladores/compilarLexmotor');
        console.log('📄 Documento detectado:', jsonData.documento || jsonData.titulo || 'Sin título');
        // Determinar tipo de estructura
        let contenido = [];
        if (jsonData.tokens && Array.isArray(jsonData.tokens)) {
            // Formato InDesign (tokens)
            if (jsonData.tokens.length === 1 && jsonData.tokens[0].contenido) {
                // Caso Decreto 252 (contenido dentro del token)
                contenido = jsonData.tokens[0].contenido.map((p, i) => ({
                    id: i + 1,
                    texto: p.texto || '',
                    inDesignStyle: p.estilo || 'P01_BODY_BASE',
                    tipo: p.tipo || 'parrafo'
                }));
            } else {
                // Caso Constitución (tokens directos)
                contenido = jsonData.tokens.map((t, i) => ({
                    id: i + 1,
                    texto: t.texto_completo || t.texto_limpio || '',
                    inDesignStyle: t.estilo_indesign || 'P01_BODY_BASE',
                    tipo: t.tipo || 'parrafo'
                }));
            }
        } else if (jsonData.contenido && Array.isArray(jsonData.contenido)) {
            contenido = jsonData.contenido;
        }
        if (contenido.length === 0) {
            console.log('⚠️ No se encontró contenido para compilar');
            return;
        }
        // Compilar
        const inicio = Date.now();
        const resultado = compilarLexmotor({ contenido }, {});
        const tiempo = Date.now() - inicio;
        if (resultado && resultado.xhtml) {
            // Guardar XHTML
            const nombreBase = (jsonData.documento || 'documento').replace(/\.indd$/i, '').replace(/[^a-zA-Z0-9-_]/g, '_');
            const rutaSalida = path.join(SALIDA_XHTML, `${nombreBase}_AUTOMATICO.xhtml`);
            fs.writeFileSync(rutaSalida, resultado.xhtml, 'utf8');
            const h1 = (resultado.xhtml.match(/<h1/g) || []).length;
            const h2 = (resultado.xhtml.match(/<h2/g) || []).length;
            const p = (resultado.xhtml.match(/<p/g) || []).length;
            console.log(`✅ Compilado en ${tiempo}ms`);
            console.log(`   XHTML: ${resultado.xhtml.length} bytes`);
            console.log(`   <h1>: ${h1} | <h2>: ${h2} | <p>: ${p}`);
            console.log(`   Guardado: ${rutaSalida}`);
        }
    } catch (error) {
        console.error('❌ Error compilando:', error.message);
    }
}
// Crear watcher
const watcher = chokidar.watch(PLUGIN_JSON, {
    persistent: true,
    awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 100
    }
});
watcher.on('change', async () => {
    if (procesando) return;
    procesando = true;
    console.log('');
    console.log('🔄 Cambio detectado en el JSON del plugin...');
    try {
        const jsonData = JSON.parse(fs.readFileSync(PLUGIN_JSON, 'utf8'));
        await compilarJSON(jsonData);
    } catch (e) {
        console.error('❌ Error leyendo JSON:', e.message);
    }
    procesando = false;
});
console.log('✅ Watcher listo - esperando cambios...');
console.log('💡 En InDesign: haz clic en "Probar Estado Panel"');
console.log('');
console.log('Presiona Ctrl+C para detener');