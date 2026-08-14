// procesarLote.js (Versión Estricta y Auditable)
const fs = require('fs');
const path = require('path');
const { compilarLexmotor } = require('./src/compiladores/compilarLexmotor');
const { adaptarInDesign } = require('./src/adaptadores/InDesignAdapter');

const carpetaEntrada = path.join(__dirname, 'MisJSON');
const carpetaSalida = path.join(__dirname, 'salidaXHTML');
const carpetaEstilos = path.join(__dirname, 'estilos');

async function procesarCarpeta() {
    try {
        if (!fs.existsSync(carpetaEntrada)) {
            console.error(`❌ Error: No se encontró la carpeta de entrada '${carpetaEntrada}'.`);
            return;
        }

        if (!fs.existsSync(carpetaSalida)) {
            fs.mkdirSync(carpetaSalida, { recursive: true });
        }

        const archivos = fs.readdirSync(carpetaEntrada);
        const archivosJSON = archivos.filter(file => file.endsWith('.json') && !file.includes('semantic_map'));

        if (archivosJSON.length === 0) {
            console.log('⚠️ Aviso: La carpeta MisJSON no contiene archivos .json para procesar.');
            return;
        }

        console.log(`🚀 Iniciando procesamiento masivo estricto de ${archivosJSON.length} archivo(s)...\n`);

        const auditoriaLote = [];

        for (const archivo of archivosJSON) {
            const rutaArchivo = path.join(carpetaEntrada, archivo);
            const nombreDocumento = path.basename(archivo, '.json');
            let estadoItem = { archivo, estado: 'PENDIENTE', detalle: '' };

            try {
                const contenidoCrudo = fs.readFileSync(rutaArchivo, 'utf8');
                const jsonParseado = JSON.parse(contenidoCrudo.replace(/^\uFEFF/, ''));
                console.log(`📄 Analizando: ${archivo}...`);

                // 1. Búsqueda exclusiva de mapa propio (estilos/ o MisJSON/)
                let rutaMapaUsada = path.join(carpetaEstilos, `${nombreDocumento}.semantic_map.json`);
                if (!fs.existsSync(rutaMapaUsada)) {
                    rutaMapaUsada = path.join(carpetaEntrada, `${nombreDocumento}.semantic_map.json`);
                }

                // 2. Fail-fast estricto si falta el mapa propio (Sin fallback silencioso)
                if (!fs.existsSync(rutaMapaUsada)) {
                    estadoItem.estado = 'OMITIDO';
                    estadoItem.detalle = 'Mapa semántico faltante (requiere creación)';
                    console.log(`   ⚠️ Omitido: ${estadoItem.detalle}`);
                    auditoriaLote.push(estadoItem);
                    continue;
                }

                const semanticMap = JSON.parse(fs.readFileSync(rutaMapaUsada, 'utf8'));

                // 3. Capa Anticorrupción (E10) - Inyección Ontológica
                const adaptacion = adaptarInDesign({ jsonCrudo: jsonParseado, semanticMap });

                // 4. Bloqueo estricto por diagnósticos de E10
                if (!adaptacion.diagnostics.valid) {
                    const motivos = adaptacion.diagnostics.warnings.join('; ');
                    estadoItem.estado = 'RECHAZADO_E10';
                    estadoItem.detalle = motivos;
                    console.log(`   ❌ Rechazado por E10: ${motivos}`);
                    auditoriaLote.push(estadoItem);
                    continue;
                }

                // 5. Preparar rutas auxiliares aisladas
                const mapOutput = path.join(carpetaSalida, `${nombreDocumento}.semantic_map.json`);
                const profilePath = path.join(carpetaSalida, `${nombreDocumento}.profile_map.json`);
                fs.writeFileSync(mapOutput, JSON.stringify(adaptacion.semanticMap));
                fs.writeFileSync(profilePath, '{}');

                // 6. Invocación de la Interfaz Canónica del Núcleo
                const resultado = await compilarLexmotor(adaptacion.ast, {
                    outputFolder: carpetaSalida,
                    semanticMapPath: mapOutput,
                    profileStyleMapPath: profilePath
                });

                // 7. Persistencia del XHTML resultante
                const rutaSalida = path.join(carpetaSalida, `${nombreDocumento}.xhtml`);
                fs.writeFileSync(rutaSalida, resultado.xhtml, 'utf8');

                estadoItem.estado = 'EXITOSO';
                estadoItem.detalle = `${nombreDocumento}.xhtml generado`;
                console.log(`   ✔️  Generado con éxito: ${nombreDocumento}.xhtml`);
                auditoriaLote.push(estadoItem);

            } catch (errorItem) {
                estadoItem.estado = 'ERROR_CRITICO';
                estadoItem.detalle = errorItem.message;
                console.error(`   ❌ Error crítico en '${archivo}':`, errorItem.message);
                auditoriaLote.push(estadoItem);
            }
        }

        // Resumen auditable de los 8 archivos
        console.log(`\n==================================================`);
        console.log(`📋 REPORTE DE AUDITORÍA DEL LOTE (${archivosJSON.length} archivos analizados):`);
        console.log(`==================================================`);
        auditoriaLote.forEach((item, index) => {
            console.log(`${index + 1}. [${item.estado}] ${item.archivo} -> ${item.detalle}`);
        });
        console.log(`==================================================\n`);

    } catch (errorGlobal) {
        console.error('❌ Error general en la ejecución por lotes:', errorGlobal.message);
    }
}

procesarCarpeta();