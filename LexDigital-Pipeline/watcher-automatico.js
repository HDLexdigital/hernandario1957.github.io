'use strict';
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const config = require('./config.json');
const { compilarLexmotor } = require('./core/index');

// Rutas configurables con soporte multiplataforma
const PLUGIN_JSON = process.env.LEXMOTOR_PLUGIN_JSON || path.resolve(__dirname, 'ipc', 'documento_extraido.json');
const SALIDA_XHTML = process.env.LEXMOTOR_SALIDA_XHTML || path.resolve(__dirname, config.rutas?.xhtml || 'salidas/xhtml');

// Asegurar directorios de salida
if (!fs.existsSync(SALIDA_XHTML)) {
    fs.mkdirSync(SALIDA_XHTML, { recursive: true });
}

let procesando = false;

async function compilarJSON(jsonData) {
    try {
        const tituloDoc = (jsonData.documento && jsonData.documento.titulo) || jsonData.titulo || 'documento';
        console.log('📄 Documento detectado:', tituloDoc);

        let contenido = [];
        if (jsonData.tokens && Array.isArray(jsonData.tokens)) {
            if (jsonData.tokens.length === 1 && jsonData.tokens[0].contenido) {
                contenido = jsonData.tokens[0].contenido.map((p, i) => ({
                    id: i + 1,
                    texto: String(p.texto || '').trim(),
                    tipo: 'parrafo'
                }));
            } else {
                contenido = jsonData.tokens.map((t, i) => ({
                    id: i + 1,
                    texto: String(t.texto_completo || t.texto_limpio || t.texto || '').trim(),
                    tipo: 'parrafo'
                }));
            }
        } else if (jsonData.contenido && Array.isArray(jsonData.contenido)) {
            contenido = jsonData.contenido.map((c, i) => ({
                id: c.id ?? i + 1,
                texto: String(c.texto || c.contenido || '').trim(),
                tipo: c.tipo || 'parrafo'
            }));
        }

        const contenidoValido = contenido.filter(c => c.texto.length > 0);
        if (contenidoValido.length === 0) {
            console.log('⚠️ No se encontró contenido válido para compilar');
            return;
        }

        const payload = {
            documento: {
                titulo: String(tituloDoc).trim()
            },
            contenido: contenidoValido
        };

        const inicio = Date.now();
        const resultado = await compilarLexmotor(payload, tituloDoc, 'Lexdigital_Modular.css', { debug: false });
        const tiempo = Date.now() - inicio;

        if (resultado && resultado.xhtml) {
            const nombreBase = String(tituloDoc).replace(/\.indd$/i, '').replace(/[^a-zA-Z0-9-_]/g, '_');
            const rutaSalida = path.join(SALIDA_XHTML, `${nombreBase}_AUTOMATICO.xhtml`);
            fs.writeFileSync(rutaSalida, resultado.xhtml, 'utf8');

            const h1 = (resultado.xhtml.match(/<h1/g) || []).length;
            const h2 = (resultado.xhtml.match(/<h2/g) || []).length;
            const p = (resultado.xhtml.match(/<p/g) || []).length;

            console.log(`✅ Compilado en ${tiempo}ms`);
            console.log(`   XHTML: ${resultado.xhtml.length} bytes`);
            console.log(`   <h1>: ${h1} | <h2>: ${h2} | <p>: ${p}`);
            console.log(`   Guardado: ${rutaSalida}`);
            return { exito: true, ruta: rutaSalida, bytes: resultado.xhtml.length };
        }
    } catch (error) {
        console.error('❌ Error compilando:', error.message);
        return { exito: false, error: error.message };
    }
}

function iniciarWatcherAutomatico() {
    console.log('=============================================');
    console.log('   WATCHER AUTOMÁTICO: PLUGIN → COMPILADOR');
    console.log('=============================================');
    console.log('Observando:', PLUGIN_JSON);
    console.log('Salida:', SALIDA_XHTML);
    console.log('=============================================');

    // Asegurar directorio padre de PLUGIN_JSON
    const dirPlugin = path.dirname(PLUGIN_JSON);
    if (!fs.existsSync(dirPlugin)) {
        fs.mkdirSync(dirPlugin, { recursive: true });
    }

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
        console.log('\n🔄 Cambio detectado en el JSON del plugin...');
        try {
            const jsonData = JSON.parse(fs.readFileSync(PLUGIN_JSON, 'utf8'));
            await compilarJSON(jsonData);
        } catch (e) {
            console.error('❌ Error leyendo JSON:', e.message);
        }
        procesando = false;
    });

    console.log('✅ Watcher listo - esperando cambios...');
    return watcher;
}

if (require.main === module) {
    iniciarWatcherAutomatico();
}

module.exports = {
    compilarJSON,
    iniciarWatcherAutomatico
};