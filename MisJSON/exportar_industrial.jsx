// exportar_industrial.jsx
function exportarParaLexDigital() {
    var doc = app.activeDocument;
    if (!doc) {
        alert("No hay ningún documento activo en InDesign.");
        return;
    }

    // Obtener el nombre limpio del archivo sin la extensión .indd
    var nombreOriginal = doc.name;
    var nombreLimpio = nombreOriginal.replace(/\.[^\.]+$/, '').replace(/[\s\-\/\\]+/g, '_').toLowerCase();

    // Ruta de la carpeta MisJSON en la raíz del proyecto
    var carpetaMisJSON = new Folder("H:/LexDigital/Recursos/AUTOMATIZAR INDESIGN/proyecto-lexdigital_modular/MisJSON");
    if (!carpetaMisJSON.exists) {
        carpetaMisJSON.create();
    }

    var archivoJson = new File(carpetaMisJSON.fsName + "/" + nombreLimpio + ".json");

    // Simulación o llamada a tu función de extracción de tokens AST existente
    var astData = extraerASTDesdeInDesign(doc); 

    archivoJson.open("w");
    archivoJson.encoding = "UTF-8";
    archivoJson.write(JSON.stringify(astData, null, 2));
    archivoJson.close();

    alert("✅ AST exportado con éxito en MisJSON/" + nombreLimpio + ".json");
}

function extraerASTDesdeInDesign(doc) {
    // Aquí mantienes tu lógica actual de lectura de párrafos, estilos e historias de InDesign
    return {
        documento: { titulo: doc.name },
        contenido: [] 
    };
}

exportarParaLexDigital();