#target indesign
#include "polyfills/json2.jsx"

function ejecutarSincronizacionLexCore() {
    if (app.documents.length === 0) {
        alert("CRITICAL: No hay ningún documento activo en Adobe InDesign.");
        return;
    }

    var doc = app.activeDocument;
    
    // Ruta absoluta o relativa al manifiesto maestro en el entorno del proyecto
    var rutaManifiesto = "H:/LexDigital/Recursos/AUTOMATIZAR INDESIGN/proyecto-lexdigital_modular/templates/lexcore-ontology.json";
    var archivoJson = new File(rutaManifiesto);

    if (!archivoJson.exists) {
        alert("CRITICAL: No se encontró el esquema ontológico en:\n" + rutaManifiesto);
        return;
    }

    archivoJson.open("r");
    var contenidoJson = archivoJson.read();
    archivoJson.close();

    var ontologia;
    try {
        ontologia = JSON.parse(contenidoJson);
    } catch (e) {
        alert("CRITICAL: Error al parsear el JSON ontológico: " + e.message);
        return;
    }

    var stats = {
        parrafosActualizados: 0,
        parrafosOmitidos: 0,
        caracteresActualizados: 0,
        caracteresOmitidos: 0,
        erroresGobernanza: []
    };

    var cat = ontologia.catalogoEstilos;

    // --- 1. PROCESAMIENTO DE ESTILOS DE PÁRRAFO ---
    var reglasParrafo = cat.parrafos || [];
    for (var i = 0; i < reglasParrafo.length; i++) {
        var r = reglasParrafo[i];
        var estilo = doc.paragraphStyles.itemByName(r.nombre);

        if (!estilo.isValid) {
            stats.parrafosOmitidos++;
            if (ontologia.politicaGobernanza.abortarEnEstiloHuerfano) {
                stats.erroresGobernanza.push("Párrafo huérfano en documento: '" + r.nombre + "'");
            }
            continue;
        }

        while (estilo.styleExportTagMaps.length > 0) {
            estilo.styleExportTagMaps[0].remove();
        }

        try {
            estilo.styleExportTagMaps.add({
                exportType: "EPUB",
                exportTag: r.etiquetaHtml,
                exportClass: r.claseCss,
                exportAttributes: r.rolAria
            });
            estilo.styleExportTagMaps.add({
                exportType: "PDF",
                exportTag: r.pdfTag,
                exportClass: "",
                exportAttributes: ""
            });
            stats.parrafosActualizados++;
        } catch (e) {
            stats.erroresGobernanza.push("Error aplicando regla de párrafo '" + r.nombre + "': " + e.message);
        }
    }

    // --- 2. PROCESAMIENTO DE ESTILOS DE CARÁCTER ---
    var reglasCaracter = cat.caracteres || [];
    for (var j = 0; j < reglasCaracter.length; j++) {
        var rc = reglasCaracter[j];
        var estiloChar = doc.characterStyles.itemByName(rc.nombre);

        if (!estiloChar.isValid) {
            stats.caracteresOmitidos++;
            continue;
        }

        while (estiloChar.styleExportTagMaps.length > 0) {
            estiloChar.styleExportTagMaps[0].remove();
        }

        try {
            estiloChar.styleExportTagMaps.add({
                exportType: "EPUB",
                exportTag: rc.etiquetaHtml,
                exportClass: rc.claseCss,
                exportAttributes: rc.rolAria
            });
            estiloChar.styleExportTagMaps.add({
                exportType: "PDF",
                exportTag: rc.pdfTag,
                exportClass: "",
                exportAttributes: ""
            });
            stats.caracteresActualizados++;
        } catch (e) {
            stats.erroresGobernanza.push("Error aplicando regla de carácter '" + rc.nombre + "': " + e.message);
        }
    }

    // --- 3. REPORTE DE SALIDA Y GOBERNANZA ---
    var reporteFinal = "LEXCORE - SINCRONIZACIÓN ONTOLÓGICA\n\n" +
        "• Párrafos sincronizados: " + stats.parrafosActualizados + "\n" +
        "• Caracteres sincronizados: " + stats.caracteresActualizados + "\n" +
        "• Omitidos (no presentes en el .indd): " + (stats.parrafosOmitidos + stats.caracteresOmitidos) + "\n";

    if (stats.erroresGobernanza.length > 0) {
        reporteFinal += "\n⚠️ ALERTAS DE GOBERNANZA:\n" + stats.erroresGobernanza.join("\n");
    } else {
        reporteFinal += "\nEstado: CONTRATO CUMPLIDO 100%";
    }

    alert(reporteFinal);
}

ejecutarSincronizacionLexCore();