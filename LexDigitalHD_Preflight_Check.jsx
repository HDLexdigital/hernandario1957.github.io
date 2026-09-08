/**
 * LexDigitalHD - Pre-flight Corpus Inspection Script
 * Versión: Baseline E18-E26 / O2 Compliance
 * Descripción: Recorre el documento activo de InDesign y valida que 
 * la estructura cumpla con las condiciones iniciales para el AST.
 */
#target indesign

function runLexDigitalPreflight() {
    if (app.documents.length === 0) {
        alert("⚠️ Error: No hay ningún documento abierto en InDesign para auditar.");
        return;
    }

    var doc = app.activeDocument;
    var report = {
        documentName: doc.name,
        timestamp: new Date().toISOString(),
        status: "PASSED",
        errors: [],
        warnings: [],
        metrics: {
            storiesCount: doc.stories.length,
            textFramesCount: doc.textFrames.length,
            paragraphsCount: 0,
            taggedNodesDetected: 0
        }
    };

    // 1. Validación de Integridad de Textos e Hilos (Stories)
    for (var i = 0; i < doc.stories.length; i++) {
        var story = doc.stories[i];
        report.metrics.paragraphsCount += story.paragraphs.length;

        // Verificar overset (desbordamiento de texto crítico en maquetación legal)
        if (story.textContainers.length > 0) {
            var lastFrame = story.textContainers[story.textContainers.length - 1];
            if (lastFrame.overflows) {
                report.errors.push("❌ Overset (Texto desbordado) detectado en el hilo de texto #" + (i + 1) + ". Debe resolverse antes de compilar.");
                report.status = "FAILED";
            }
        }
    }

    // 2. Validación de Estilos y Estructura Semántica (Simulación de AST)
    // El script busca si los párrafos usan estilos tipográficos institucionales o si hay formato directo (vicios)
    var defaultStyleName = "[No Paragraph Style]";
    for (var j = 0; j < doc.paragraphStyles.length; j++) {
        var pStyle = doc.paragraphStyles[j];
        // Aquí se pueden auditar nombres de estilos esperados para el AST (ej. "Articulo", "Titulo", "Parrafo")
    }

    // Comprobación de estilos sin asignar o formato directo sospechoso
    for (var s = 0; s < doc.stories.length; s++) {
        var paragraphs = doc.stories[s].paragraphs;
        for (var p = 0; p < paragraphs.length; p++) {
            var para = paragraphs[p];
            if (para.appliedParagraphStyle.name === defaultStyleName) {
                report.warnings.push("⚠️ Advertencia en párrafo " + (p + 1) + ": Se detectó texto sin estilo institucional asignado (Default style).");
            }
        }
    }

    // 3. Resultado de la Auditoría
    var summaryMessage = "========================================\n" +
                         " REPORTE DE PRE-FLIGHT LEXDIGITALHD\n" +
                         "========================================\n" +
                         "📁 Documento: " + report.documentName + "\n" +
                         "📊 Párrafos analizados: " + report.metrics.paragraphsCount + "\n" +
                         "🛑 Errores críticos: " + report.errors.length + "\n" +
                         "⚠️ Advertencias: " + report.warnings.length + "\n" +
                         "🏁 Estado del Check: " + report.status + "\n" +
                         "========================================\n\n";

    if (report.errors.length > 0) {
        summaryMessage += "ERRORES DETECTADOS:\n- " + report.errors.join("\n- ") + "\n\n";
        alert(summaryMessage, "LexDigitalHD - Pre-flight Fallido", true);
    } else {
        summaryMessage += "✅ El documento cumple con las condiciones iniciales estructurales y está listo para la extracción de su AST e integración con el compilador.";
        alert(summaryMessage, "LexDigitalHD - Pre-flight Aprobado", false);
    }

    return report;
}

// Ejecutar la auditoría
runLexDigitalPreflight();