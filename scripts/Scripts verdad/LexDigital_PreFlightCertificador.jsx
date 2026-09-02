#target indesign

function certificarYGenerarReporteCorpus() {
    if (app.documents.length === 0) {
        alert("CRITICAL: No hay ningún documento activo en Adobe InDesign.");
        return;
    }

    var doc = app.activeDocument;
    var timestamp = new Date().toISOString();
    
    // 1. Definición del Contrato Canónico Requerido
    var estilosObligatoriosParrafo = [
        "P01_BODY_BASE", 
        "P02_TITLE_MAIN", 
        "P02_TITLE_CHAPTER", 
        "articulo"
    ];

    var informe = {
        documento: doc.name,
        timestamp: timestamp,
        estadoGeneral: "APROBADO",
        metricas: {
            totalParrafosEstudiados: 0,
            totalEstilosVerificados: 0,
            advertenciasOverrides: 0,
            erroresEstructurales: 0
        },
        hallazgos: {
            estilosFaltantes: [],
            elementosSinMapeoExportacion: [],
            violacionesFormatoDirecto: []
        },
        metadatosEditorial: {
            titulo: doc.metadataPreferences.documentTitle || doc.name,
            autor: doc.metadataPreferences.author || "No especificado",
            descripcion: doc.metadataPreferences.description || "No especificada"
        }
    };

    // 2. Auditoría de Macroestructura y Estilos Obligatorios
    var paraStyles = doc.allParagraphStyles;
    var estilosEnDocumento = {};
    for (var i = 0; i < paraStyles.length; i++) {
        estilosEnDocumento[paraStyles[i].name] = paraStyles[i];
    }

    for (var j = 0; j < estilosObligatoriosParrafo.length; j++) {
        var nombreReq = estilosObligatoriosParrafo[j];
        if (!estilosEnDocumento[nombreReq]) {
            informe.hallazgos.estilosFaltantes.push(nombreReq);
            informe.metricas.erroresEstructurales++;
        }
    }

    // 3. Verificación de Mapeo Semántico, Accesibilidad y Export Tags
    var stories = doc.stories;
    for (var s = 0; s < stories.length; s++) {
        var paragraphs = stories[s].paragraphs;
        for (var p = 0; p < paragraphs.length; p++) {
            informe.metricas.totalParrafosEstudiados++;
            var parr = paragraphs[p];
            var estiloAsignado = parr.appliedParagraphStyle;

            // Validar si el estilo cuenta con reglas de exportación (EPUB/PDF/ARIA)
            if (estiloAsignado.styleExportTagMaps.length === 0) {
                var textoMuestra = parr.contents.substring(0, 30).replace(/[\r\n]/g, " ");
                if (textoMuestra.trim().length > 0) {
                    var idRegistro = "Párrafo [" + (p + 1) + "]: '" + textoMuestra + "...' usa estilo sin mapear (" + estiloAsignado.name + ")";
                    if (informe.hallazgos.elementosSinMapeoExportacion.length < 50) { // Límite de reporte
                        informe.hallazgos.elementosSinMapeoExportacion.push(idRegistro);
                    }
                }
            }

            // Detección de formato directo (Overrides tipográficos que rompen la abstracción visual)
            try {
                if (parr.overrideType != OverrideType.NONE) {
                    informe.metricas.advertenciasOverrides++;
                }
            } catch (e) {}
        }
    }

    // 4. Determinación del Estado de Gobernanza (Fail Fast)
    if (informe.metricas.erroresEstructurales > 0 || informe.hallazgos.elementosSinMapeoExportacion.length > 0) {
        informe.estadoGeneral = "RECHAZADO";
    }

    // 5. Escritura del Reporte en el Sistema de Archivos
    var rutaCarpetaProyecto = "H:/LexDigital/Recursos/AUTOMATIZAR INDESIGN/proyecto-lexdigital_modular/MisJSON/";
    var carpetaSalida = new Folder(rutaCarpetaProyecto);
    if (!carpetaSalida.exists) {
        carpetaSalida.create();
    }

    var archivoReporte = new File(rutaCarpetaProyecto + "reporte_certificacion_corpus.json");
    archivoReporte.encoding = "UTF-8";
    archivoReporte.open("w");
    archivoReporte.write(JSON.stringify(informe, null, 2));
    archivoReporte.close();

    // 6. Alerta Visual Inmediata para el Operador
    var mensajeResultado = "AUDITORÍA CANÓNICA DE CORPUS\n\n" +
        "• Estado: " + informe.estadoGeneral + "\n" +
        "• Párrafos analizados: " + informe.metricas.totalParrafosEstudiados + "\n" +
        "• Estilos obligatorios faltantes: " + informe.metricas.erroresEstructurales + "\n" +
        "• Nodos sin mapeo de exportación: " + informe.hallazgos.elementosSinMapeoExportacion.length + "\n" +
        "• Sobrecargas de formato directo (Overrides): " + informe.metricas.advertenciasOverrides + "\n\n" +
        "Reporte detallado guardado en:\n" + archivoReporte.fsName;

    alert(mensajeResultado);
}

certificarYGenerarReporteCorpus();