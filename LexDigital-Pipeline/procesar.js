'use strict';
const fs = require('fs');
const path = require('path');
// ============================================
// CONFIGURACIÓN
// ============================================
const CONFIG = {
    formatosSoportados: ['.json', '.txt', '.md', '.markdown'],
    directorioSalida: 'salidas'
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
 * Procesa archivo JSON de InDesign
 */
function procesarJSON(contenido, nombreBase) {
    log('Procesando JSON estructurado de InDesign...', 'PROCESO');
    const datosInDesign = JSON.parse(contenido);
    return {
        version: '2.0',
        origen: 'InDesign (JSON Enriquecido)',
        metadatos: {
            titulo: datosInDesign.titulo || nombreBase,
            fechaProceso: new Date().toISOString(),
            totalElementos: Array.isArray(datosInDesign.contenido) 
                ? datosInDesign.contenido.length 
                : Object.keys(datosInDesign).length
        },
        contenido: datosInDesign
    };
}
/**
 * Procesa archivo de texto plano o Markdown
 */
function procesarTexto(contenido, nombreBase) {
    log('Procesando texto plano o Markdown...', 'PROCESO');
    const lineas = contenido.split(/\r?\n/).filter(l => l.trim().length > 0);
    const listaParrafos = [];
    for (let i = 0; i < lineas.length; i++) {
        const linea = lineas[i];
        const textoLimpio = linea.replace(/^#+\s*/, '').trim();
        // Detectar tipo
        let tipo = 'parrafo';
        let nivel = null;
        if (linea.startsWith('###')) {
            tipo = 'subtitulo';
            nivel = 3;
        } else if (linea.startsWith('##')) {
            tipo = 'subtitulo';
            nivel = 2;
        } else if (linea.startsWith('#')) {
            tipo = 'titulo';
            nivel = 1;
        } else if (linea.startsWith('- ') || linea.startsWith('* ')) {
            tipo = 'lista';
            nivel = null;
        } else if (linea.startsWith('> ')) {
            tipo = 'cita';
            nivel = null;
        } else if (linea.startsWith('---')) {
            tipo = 'separador';
            nivel = null;
        }
        listaParrafos.push({
            id: i + 1,
            tipo,
            nivel,
            texto: textoLimpio
        });
    }
    // Estadísticas
    const stats = {
        total: listaParrafos.length,
        titulos: listaParrafos.filter(p => p.tipo === 'titulo').length,
        subtitulos: listaParrafos.filter(p => p.tipo === 'subtitulo').length,
        parrafos: listaParrafos.filter(p => p.tipo === 'parrafo').length,
        listas: listaParrafos.filter(p => p.tipo === 'lista').length,
        citas: listaParrafos.filter(p => p.tipo === 'cita').length
    };
    return {
        version: '2.0',
        origen: 'Texto / Markdown',
        metadatos: {
            titulo: nombreBase,
            fechaProceso: new Date().toISOString(),
            ...stats
        },
        contenido: listaParrafos
    };
}
/**
 * Intenta compilar con el motor LexDigital si está disponible
 */
async function intentarCompilacion(resultadoProcesado, nombreBase) {
    try {
        const { compilarLexmotor } = require('../src/index');
        log('Motor LexDigital detectado, compilando...', 'PROCESO');
        const resultado = await compilarLexmotor(
            resultadoProcesado,
            nombreBase,
            null
        );
        return {
            ...resultadoProcesado,
            compilacion: resultado
        };
    } catch (e) {
        log(`Compilación omitida: ${e.message}`, 'WARN');
        return resultadoProcesado;
    }
}
// ============================================
// FUNCIÓN PRINCIPAL
// ============================================
async function main() {
    const args = process.argv.slice(2);
    // Validar argumentos
    if (args.length === 0) {
        log('Debes proporcionar la ruta del archivo.', 'ERROR');
        console.log('Uso: node procesar.js <ruta-del-archivo>');
        process.exit(1);
    }
    const archivoRuta = path.resolve(args[0]);
    // Validar que existe
    if (!fs.existsSync(archivoRuta)) {
        log(`El archivo no existe: ${archivoRuta}`, 'ERROR');
        process.exit(1);
    }
    const extension = path.extname(archivoRuta).toLowerCase();
    const nombreBase = path.basename(archivoRuta, extension);
    const contenidoCrudo = fs.readFileSync(archivoRuta, 'utf8');
    log(`Leyendo archivo: ${path.basename(archivoRuta)}`);
    const inicioTiempo = Date.now();
    try {
        let resultadoProcesado;
        // Procesar según extensión
        if (extension === '.json') {
            resultadoProcesado = procesarJSON(contenidoCrudo, nombreBase);
        } else if (['.txt', '.md', '.markdown'].includes(extension)) {
            resultadoProcesado = procesarTexto(contenidoCrudo, nombreBase);
        } else {
            log(`Formato no soportado: ${extension}`, 'ERROR');
            console.log(`Formatos soportados: ${CONFIG.formatosSoportados.join(', ')}`);
            process.exit(1);
        }
        // Intentar compilación con motor real
        resultadoProcesado = await intentarCompilacion(resultadoProcesado, nombreBase);
        const tiempoTotal = Date.now() - inicioTiempo;
        // Guardar resultado
        const directorioSalida = path.join(path.dirname(archivoRuta), CONFIG.directorioSalida);
        if (!fs.existsSync(directorioSalida)) {
            fs.mkdirSync(directorioSalida, { recursive: true });
        }
        const archivoSalida = path.join(directorioSalida, `${nombreBase}_compilado.json`);
        fs.writeFileSync(archivoSalida, JSON.stringify(resultadoProcesado, null, 2), 'utf8');
        console.log('--------------------------------------------------');
        log('Procesamiento completado con éxito!');
        console.log(`📄 Archivo generado: ${archivoSalida}`);
        console.log(`⏱️ Tiempo: ${tiempoTotal}ms`);
        console.log(`📊 Párrafos: ${resultadoProcesado.metadatos?.total || resultadoProcesado.metadatos?.totalParrafos || 'N/A'}`);
    } catch (error) {
        log(`Error crítico: ${error.message}`, 'ERROR');
        process.exit(1);
    }
}
// Ejecutar
main().catch(error => {
    log(`Error fatal: ${error.message}`, 'ERROR');
    process.exit(1);
});