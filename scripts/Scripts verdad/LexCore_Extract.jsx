#target indesign
#include "polyfills/json2.jsx"

function extraerAstEnriquecido() {
    if (app.documents.length === 0) {
        alert("CRITICAL: No hay ningún documento activo en Adobe InDesign.");
        return;
    }

    var doc = app.activeDocument;
    var rutaRaiz = new File($.fileName).parent.parent.fullName;
    var rutaManifiesto = rutaRaiz + "/templates/lexcore-ontology.json";
    
    // Cargar ontología para enriquecimiento directo
    var archivoJson = new File(rutaManifiesto);
    var ontologia = null;
    if (archivoJson.exists) {
        archivoJson.open("r");
        try {
            ontologia = JSON.parse(archivoJson.read());
        } catch (e) {}
        archivoJson.close();
    }

    // Mapa rápido de metadatos ontológicos por nombre de estilo
    var mapaOntologicoParrafos = {};
    if (ontologia && ontologia.catalogoEstilos && ontologia.catalogoEstilos.parrafos) {
        var pList = ontologia.catalogoEstilos.parrafos;
        for (var i = 0; i < pList.length; i++) {
            mapaOntologicoParrafos[pList[i].nombre] = pList[i];
        }
    }

    var ast = {
        version: "3.1.0",
        documento: doc.name,
        timestamp: new Date().toISOString(),
        metadatosDocumento: {
            titulo: doc.metadataPreferences.documentTitle || doc.name,
            autor: doc.metadataPreferences.author || "LexDigitalHD"
        },
        cuerpoObra: []
    };

    var contadorNodos = 0;
    var stories = doc.stories;

    // Recorrido estricto de historias (soporta marcos independientes y tiras continuas)
    for (var s = 0; s < stories.length; s++) {
        var paragraphs = stories[s].paragraphs;
        
        for (var p = 0; p < paragraphs.length; p++) {
            var parr = paragraphs[p];
            var textoContenido = parr.contents;
            
            // Omitir párrafos totalmente vacíos que no aporten semántica estructural
            if (!textoContenido || textoContenido.replace(/[\r\n\s]/g, "").length === 0) {
                continue;
            }

            var nombreEstilo = parr.appliedParagraphStyle.name;
            var reglaOntologica = mapaOntologicoParrafos[nombreEstilo] || {
                etiquetaHtml: "p",
                claseCss: "parrafo-generico",
                ariaRole: "paragraph",
                ariaLevel: null,
                epubType: "bodymatter",
                pdfTag: "P"
            };

            contadorNodos++;
            var nodoAst = {
                nodeId: "node-" + contadorNodos,
                storyIndex: s,
                paragraphIndex: p,
                estiloInDesign: nombreEstilo,
                texto: textoContenido.replace(/[\r\n]+$/, ""), // Limpiar saltos de línea finales de InDesign
                metadatosExportacion: {
                    exportTag: reglaOntologica.etiquetaHtml,
                    exportClass: reglaOntologica.claseCss,
                    ariaRole: reglaOntologica.ariaRole,
                    ariaLevel: reglaOntologica.ariaLevel,
                    epubType: reglaOntologica.epubType,
                    pdfTag: reglaOntologica.pdfTag
                }
            };

            ast.cuerpoObra.push(nodoAst);
        }
    }

    // Guardar AST enriquecido en MisJSON/
    var rutaSalida = rutaRaiz + "/MisJSON/ast_corpus_enriquecido.json";
    var archivoSalida = new File(rutaSalida);
    archivoSalida.encoding = "UTF-8";
    archivoSalida.open("w");
    archivoSalida.write(JSON.stringify(ast, null, 2));
    archivoSalida.close();

    alert(
        "EXTRACCIÓN DE AST ENRIQUECIDO COMPLETADA:\n\n" +
        "• Nodos procesados: " + contadorNodos + "\n" +
        "• Historias analizadas: " + stories.length + "\n" +
        "• Archivo generado:\n" + archivoSalida.fsName
    );
}

extraerAstEnriquecido();