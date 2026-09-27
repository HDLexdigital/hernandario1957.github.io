'use strict';
const fs = require('fs');
const path = require('path');
const { leerArchivoTextoSeguro } = require('./core/utils/textUtils');
const { compilarLexmotor } = require('./core/index');

// ============================================
// CONFIGURACIÓN
// ============================================
const CONFIG = {
    formatosSoportados: ['.json', '.txt', '.md', '.markdown'],
    directorioSalida: 'salidas',
    nombreCSS: 'Lexdigital_Modular.css'
};

// ============================================
// LOGGER
// ============================================
function log(mensaje, tipo = 'INFO') {
    const prefijo = {
        INFO: '✅',
        WARN: '⚠️',
        ERROR: '❌',
        PROCESO: '⚙️'
    }[tipo] || '📄';
    console.log(`${prefijo} ${mensaje}`);
}

// ============================================
// FUNCIONES DE PROCESAMIENTO
// ============================================

/**
 * Normaliza y procesa archivo JSON (formato InDesign o formato estándar)
 */
function procesarJSON(contenidoStr, nombreBase) {
    log('Procesando JSON estructurado...', 'PROCESO');
    const datosCrudos = JSON.parse(contenidoStr);

    let titulo = (datosCrudos.documento && datosCrudos.documento.titulo) || datosCrudos.titulo || nombreBase;
    let nodos = [];

    if (Array.isArray(datosCrudos.contenido)) {
        nodos = datosCrudos.contenido;
    } else if (Array.isArray(datosCrudos.tokens)) {
        nodos = datosCrudos.tokens;
    } else if (Array.isArray(datosCrudos)) {
        nodos = datosCrudos;
    } else {
        nodos = [datosCrudos];
    }

    const contenidoNormalizado = nodos.map((item, idx) => {
        let texto = item.texto || item.texto_completo || item.contenido || '';
        let tipo = item.tipo || 'parrafo';

        // Mapear tipos informales a vocabulario controlado
        const mapeoTipos = {
            'titulo': 'titulo_parte',
            'subtitulo': 'seccion',
            'encabezado': 'capitulo',
            'lista': 'inciso',
            'cita': 'texto_cuerpo',
            'separador': 'texto_cuerpo'
        };

        if (mapeoTipos[tipo]) {
            tipo = mapeoTipos[tipo];
        }

        return {
            id: item.id ?? idx + 1,
            tipo: tipo,
            texto: String(texto).trim() || 'Texto no especificado'
        };
    }).filter(n => n.texto.length > 0);

    return {
        documento: {
            titulo: String(titulo).trim() || 'Documento sin título',
            totalElementos: contenidoNormalizado.length,
            fechaProceso: new Date().toISOString()
        },
        contenido: contenidoNormalizado
    };
}

/**
 * Procesa archivo de texto plano o Markdown
 */
function procesarTexto(contenidoStr, nombreBase) {
    log('Procesando texto plano o Markdown...', 'PROCESO');
    const lineas = contenidoStr.split(/\r?\n/).filter(l => l.trim().length > 0);
    const listaParrafos = [];

    for (let i = 0; i < lineas.length; i++) {
        const linea = lineas[i];
        const textoLimpio = linea.replace(/^#+\s*/, '').trim();
        if (!textoLimpio) continue;

        // Mapear estrictamente a TIPOS_VALIDOS
        let tipo = 'parrafo';
        if (linea.startsWith('###')) {
            tipo = 'seccion';
        } else if (linea.startsWith('##')) {
            tipo = 'capitulo';
        } else if (linea.startsWith('#')) {
            tipo = 'titulo_parte';
        } else if (linea.startsWith('- ') || linea.startsWith('* ')) {
            tipo = 'inciso';
        } else if (linea.match(/^Artículo\s+\d+/i)) {
            tipo = 'articulo';
        } else if (linea.match(/^Parágrafo/i)) {
            tipo = 'paragrafo_normativo';
        }

        listaParrafos.push({
            id: i + 1,
            tipo,
            texto: textoLimpio
        });
    }

    return {
        documento: {
            titulo: nombreBase,
            totalElementos: listaParrafos.length,
            fechaProceso: new Date().toISOString()
        },
        contenido: listaParrafos
    };
}

/**
 * Compila mediante el pipeline de LexDigital
 */
async function compilarConPipeline(documentoEstructurado, nombreBase) {
    try {
        log('Motor LexDigital Pipeline activo, compilando...', 'PROCESO');
        const resultado = await compilarLexmotor(
            documentoEstructurado,
            nombreBase,
            CONFIG.nombreCSS,
            { debug: false }
        );
        return resultado;
    } catch (e) {
        log(`Error en compilación del pipeline: ${e.message}`, 'WARN');
        return null;
    }
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================
async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        log('Debes proporcionar la ruta del archivo.', 'ERROR');
        console.log('Uso: node procesar.js <ruta-del-archivo>');
        process.exit(1);
    }

    const archivoRuta = path.resolve(args[0]);
    if (!fs.existsSync(archivoRuta)) {
        log(`El archivo no existe: ${archivoRuta}`, 'ERROR');
        process.exit(1);
    }

    const extension = path.extname(archivoRuta).toLowerCase();
    const nombreBase = path.basename(archivoRuta, extension);
    const contenidoCrudo = leerArchivoTextoSeguro(archivoRuta);

    log(`Leyendo archivo: ${path.basename(archivoRuta)}`);
    const inicioTiempo = Date.now();

    try {
        let datosDocumento;
        if (extension === '.json') {
            datosDocumento = procesarJSON(contenidoCrudo, nombreBase);
        } else if (['.txt', '.md', '.markdown'].includes(extension)) {
            datosDocumento = procesarTexto(contenidoCrudo, nombreBase);
        } else {
            log(`Formato no soportado: ${extension}`, 'ERROR');
            console.log(`Formatos soportados: ${CONFIG.formatosSoportados.join(', ')}`);
            process.exit(1);
        }

        // Ejecutar compilación canónica
        const resultadoCompilacion = await compilarConPipeline(datosDocumento, nombreBase);
        const tiempoTotal = Date.now() - inicioTiempo;

        // Directorio de salida
        const directorioSalida = path.join(path.dirname(archivoRuta), CONFIG.directorioSalida);
        if (!fs.existsSync(directorioSalida)) {
            fs.mkdirSync(directorioSalida, { recursive: true });
        }

        // Guardar JSON de salida
        const archivoSalidaJSON = path.join(directorioSalida, `${nombreBase}_compilado.json`);
        const payloadFinal = {
            version: '2.0',
            metadatos: {
                tiempoProcesoMs: tiempoTotal,
                fechaProceso: new Date().toISOString(),
                compiladoExitoso: !!resultadoCompilacion
            },
            documento: datosDocumento.documento,
            contenido: datosDocumento.contenido,
            compilacion: resultadoCompilacion || null
        };
        fs.writeFileSync(archivoSalidaJSON, JSON.stringify(payloadFinal, null, 2), 'utf8');

        // Si se generó XHTML, guardarlo también
        if (resultadoCompilacion && resultadoCompilacion.xhtml) {
            const archivoSalidaXHTML = path.join(directorioSalida, `${nombreBase}.xhtml`);
            fs.writeFileSync(archivoSalidaXHTML, resultadoCompilacion.xhtml, 'utf8');
            log(`XHTML generado: ${archivoSalidaXHTML}`);
        }

        console.log('--------------------------------------------------');
        log('Procesamiento completado con éxito!');
        console.log(`📄 Archivo JSON generado: ${archivoSalidaJSON}`);
        console.log(`⏱️ Tiempo total: ${tiempoTotal}ms`);
        console.log(`📊 Párrafos procesados: ${datosDocumento.contenido.length}`);
    } catch (error) {
        log(`Error crítico: ${error.message}`, 'ERROR');
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(error => {
        log(`Error fatal: ${error.message}`, 'ERROR');
        process.exit(1);
    });
}

module.exports = {
    procesarJSON,
    procesarTexto,
    compilarConPipeline
};